import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';


import {
  CreateContactDto,
  UpdateContactDto,
  QueryContactsDto,
} from './dto';
import { Company, Contact, CustomField, CustomFieldValue, Tenant } from 'src/common/entities';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(CustomField)
    private customFieldRepository: Repository<CustomField>,
    @InjectRepository(CustomFieldValue)
    private customFieldValueRepository: Repository<CustomFieldValue>,
  ) {}

  /**
   * Create a new contact
   */
  async create(tenantId: string, dto: CreateContactDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (!tenant.isActive) throw new BadRequestException('Tenant is not active');

    // Optional: enforce email uniqueness within tenant
    if (dto.email) {
      const existing = await this.contactRepository.findOne({
        where: { tenantId, email: dto.email },
      });
      if (existing) throw new ConflictException('Contact with this email already exists');
    }

    // Validate company
    if (dto.companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: dto.companyId, tenantId },
      });
      if (!company) throw new NotFoundException('Company not found');
    }

    const contact = this.contactRepository.create({
      tenantId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      companyId: dto.companyId,
      jobTitle: dto.jobTitle,
      department: dto.department,
      address: {
        street: dto.street,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
      },
      socialProfiles: {
        linkedin: dto.linkedin,
        twitter: dto.twitter,
      },
      notes: dto.notes,
      tags: dto.tags || [],
      customFields: dto.customFields || null,
    });

    const saved = await this.contactRepository.save(contact);

    // Handle custom fields via CustomFieldValue if you want a normalized approach (optional, same pattern as leads)
    if (dto.customFields) {
      await this.handleCustomFields(tenantId, saved.id, dto.customFields, 'contact');
    }

    return this.findOne(tenantId, saved.id);
  }

  /**
   * Get contacts with filtering & pagination
   */
  async findAll(tenantId: string, query: QueryContactsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      companyId,
      department,
      tag,
      isCustomer,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.company', 'company')
      .where('contact.tenantId = :tenantId', { tenantId });

    if (search) {
      qb.andWhere(
        `(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search OR contact.phone ILIKE :search OR company.name ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (companyId) {
      qb.andWhere('contact.companyId = :companyId', { companyId });
    }

    if (department) {
      qb.andWhere('contact.department = :department', { department });
    }

    if (typeof isCustomer === 'boolean') {
      qb.andWhere('contact.isCustomer = :isCustomer', { isCustomer });
    }

    if (tag) {
      // tags is jsonb array of strings
      qb.andWhere(':tag = ANY(contact.tags)', { tag });
    }

    const validSortFields = ['createdAt', 'firstName', 'lastName', 'email'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    qb.orderBy(`contact.${sortField}`, sortOrder);

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [contacts, total] = await qb.getManyAndCount();

    return {
      data: contacts.map((c) => this.formatContactResponse(c)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get one contact
   */
  async findOne(tenantId: string, id: string) {
    const contact = await this.contactRepository.findOne({
      where: { id, tenantId },
      relations: ['company', 'customFieldValues', 'customFieldValues.field'],
    });

    if (!contact) throw new NotFoundException('Contact not found');

    return this.formatContactResponse(contact);
  }

  /**
   * Update contact
   */
  async update(tenantId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.contactRepository.findOne({
      where: { id, tenantId },
      relations: ['customFieldValues'],
    });
    if (!contact) throw new NotFoundException('Contact not found');

    // Optional email uniqueness enforcement
    if (dto.email && dto.email !== contact.email) {
      const existing = await this.contactRepository.findOne({
        where: { tenantId, email: dto.email },
      });
      if (existing) throw new ConflictException('Contact with this email already exists');
    }

    // Validate company
    if (dto.companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: dto.companyId, tenantId },
      });
      if (!company) throw new NotFoundException('Company not found');
    }

    if (dto.tags !== undefined) {
      contact.tags = dto.tags;
    }

    if (dto.customFields) {
      await this.handleCustomFields(tenantId, contact.id, dto.customFields, 'contact');
      contact.customFields = dto.customFields;
    }

    // Address & socialProfiles update
    if (
      dto.street !== undefined ||
      dto.city !== undefined ||
      dto.state !== undefined ||
      dto.postalCode !== undefined ||
      dto.country !== undefined
    ) {
      contact.address = {
        ...(contact.address || {}),
        street: dto.street ?? contact.address?.street,
        city: dto.city ?? contact.address?.city,
        state: dto.state ?? contact.address?.state,
        postalCode: dto.postalCode ?? contact.address?.postalCode,
        country: dto.country ?? contact.address?.country,
      };
    }

    if (dto.linkedin !== undefined || dto.twitter !== undefined) {
      contact.socialProfiles = {
        ...(contact.socialProfiles || {}),
        linkedin: dto.linkedin ?? contact.socialProfiles?.linkedin,
        twitter: dto.twitter ?? contact.socialProfiles?.twitter,
      };
    }

    Object.assign(contact, {
      firstName: dto.firstName ?? contact.firstName,
      lastName: dto.lastName ?? contact.lastName,
      email: dto.email ?? contact.email,
      phone: dto.phone ?? contact.phone,
      companyId: dto.companyId ?? contact.companyId,
      jobTitle: dto.jobTitle ?? contact.jobTitle,
      department: dto.department ?? contact.department,
      notes: dto.notes ?? contact.notes,
    });

    const updated = await this.contactRepository.save(contact);
    return this.findOne(tenantId, updated.id);
  }

  /**
   * Soft-delete contact
   */
  async remove(tenantId: string, id: string) {
    const contact = await this.contactRepository.findOne({
      where: { id, tenantId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    await this.contactRepository.softDelete(id);
    return { message: 'Contact deleted successfully' };
  }

  /**
   * Restore soft-deleted contact
   */
  async restore(tenantId: string, id: string) {
    const contact = await this.contactRepository.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });
    if (!contact) throw new NotFoundException('Contact not found');

    await this.contactRepository.restore(id);
    return this.findOne(tenantId, id);
  }

  /**
   * Basic stats for dashboard
   */
  async getStats(tenantId: string) {
    const total = await this.contactRepository.count({ where: { tenantId } });
    const customers = await this.contactRepository.count({
      where: { tenantId, isCustomer: true },
    });

    // Distinct companies
    const companyCount = await this.contactRepository
      .createQueryBuilder('contact')
      .select('COUNT(DISTINCT contact.companyId)', 'count')
      .where('contact.tenantId = :tenantId', { tenantId })
      .andWhere('contact.companyId IS NOT NULL')
      .getRawOne();

    return {
      total,
      customers,
      companies: parseInt(companyCount.count || '0', 10),
    };
  }

  // ---- helpers ----

  private async handleCustomFields(
    tenantId: string,
    contactId: string,
    customFields: Record<string, any>,
    entityType: string,
  ) {
    const fields = await this.customFieldRepository.find({
      where: { tenantId, entityType },
    });

    // Delete existing values for this contact
    await this.customFieldValueRepository.delete({ contactId });

    const valuesToSave: CustomFieldValue[] = [];

    for (const [key, value] of Object.entries(customFields)) {
      const field = fields.find((f) => f.key === key);
      if (!field) continue;

      const v = this.customFieldValueRepository.create({
        fieldId: field.id,
        contactId,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      });

      valuesToSave.push(v);
    }

    if (valuesToSave.length) {
      await this.customFieldValueRepository.save(valuesToSave);
    }
  }

  private formatContactResponse(contact: Contact) {
    return {
      id: contact.id,
      tenantId: contact.tenantId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.jobTitle,
      department: contact.department,
      isCustomer: contact.isCustomer,
      address: contact.address,
      socialProfiles: contact.socialProfiles,
      notes: contact.notes,
      tags: contact.tags || [],
      company: contact.company
        ? {
            id: contact.company.id,
            name: contact.company.name,
            domain: contact.company.domain,
          }
        : null,
      customFields: contact.customFieldValues
        ? contact.customFieldValues.reduce((acc, cfv) => {
            acc[cfv.field.key] = cfv.value;
            return acc;
          }, {} as Record<string, any>)
        : contact.customFields || {},
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}