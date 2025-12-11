import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


import {
  CreateCompanyDto,
  UpdateCompanyDto,
  QueryCompaniesDto,
} from './dto';
import { Company, Contact, CustomField, CustomFieldValue, Deal, Lead, Tenant } from 'src/common/entities';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Deal)
    private dealRepository: Repository<Deal>,
    @InjectRepository(CustomField)
    private customFieldRepository: Repository<CustomField>,
    @InjectRepository(CustomFieldValue)
    private customFieldValueRepository: Repository<CustomFieldValue>,
  ) {}

  /**
   * Create a new company
   */
  async create(tenantId: string, dto: CreateCompanyDto) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new BadRequestException('Tenant is not active');
    }

    // Check if domain already exists (domain should be unique globally or per tenant)
    if (dto.domain) {
      const existingDomain = await this.companyRepository.findOne({
        where: { domain: dto.domain },
      });

      if (existingDomain) {
        throw new ConflictException('Company with this domain already exists');
      }
    }

    const company = this.companyRepository.create({
      tenantId,
      name: dto.name,
      domain: dto.domain,
      website: dto.website,
      phone: dto.phone,
      email: dto.email,
      industry: dto.industry,
      companySize: dto.companySize,
      employeeCount: dto.employeeCount,
      annualRevenue: dto.annualRevenue,
      currency: dto.currency || 'USD',
      description: dto.description,
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
        facebook: dto.facebook,
      },
      logo: dto.logo,
      isCustomer: dto.isCustomer || false,
      tags: dto.tags || [],
      customFields: dto.customFields || null,
    });

    const saved = await this.companyRepository.save(company);

    // Handle custom fields
    if (dto.customFields) {
      await this.handleCustomFields(tenantId, saved.id, dto.customFields, 'company');
    }

    return this.findOne(tenantId, saved.id);
  }

  /**
   * Find all companies with filtering and pagination
   */
  async findAll(tenantId: string, query: QueryCompaniesDto) {
    const {
      page = 1,
      limit = 10,
      search,
      industry,
      companySize,
      tag,
      isCustomer,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.companyRepository
      .createQueryBuilder('company')
      .where('company.tenantId = :tenantId', { tenantId });

    // Search
    if (search) {
      qb.andWhere(
        '(company.name ILIKE :search OR company.domain ILIKE :search OR company.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by industry
    if (industry) {
      qb.andWhere('company.industry = :industry', { industry });
    }

    // Filter by company size
    if (companySize) {
      qb.andWhere('company.companySize = :companySize', { companySize });
    }

    // Filter by tag
    if (tag) {
      qb.andWhere(':tag = ANY(company.tags)', { tag });
    }

    // Filter by customer status
    if (typeof isCustomer === 'boolean') {
      qb.andWhere('company.isCustomer = :isCustomer', { isCustomer });
    }

    // Sorting
    const validSortFields = ['createdAt', 'name', 'annualRevenue', 'employeeCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`company.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [companies, total] = await qb.getManyAndCount();

    return {
      data: companies.map((c) => this.formatCompanyResponse(c)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one company by ID
   */
  async findOne(tenantId: string, id: string) {
    const company = await this.companyRepository.findOne({
      where: { id, tenantId },
      relations: ['customFieldValues', 'customFieldValues.field'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.formatCompanyResponse(company);
  }

  /**
   * Update company
   */
  async update(tenantId: string, id: string, dto: UpdateCompanyDto) {
    const company = await this.companyRepository.findOne({
      where: { id, tenantId },
      relations: ['customFieldValues'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check domain uniqueness if being changed
    if (dto.domain && dto.domain !== company.domain) {
      const existingDomain = await this.companyRepository.findOne({
        where: { domain: dto.domain },
      });

      if (existingDomain) {
        throw new ConflictException('Company with this domain already exists');
      }
    }

    // Handle tags
    if (dto.tags !== undefined) {
      company.tags = dto.tags;
    }

    // Handle custom fields
    if (dto.customFields) {
      await this.handleCustomFields(tenantId, company.id, dto.customFields, 'company');
      company.customFields = dto.customFields;
    }

    // Update address
    if (
      dto.street !== undefined ||
      dto.city !== undefined ||
      dto.state !== undefined ||
      dto.postalCode !== undefined ||
      dto.country !== undefined
    ) {
      company.address = {
        ...(company.address || {}),
        street: dto.street ?? company.address?.street,
        city: dto.city ?? company.address?.city,
        state: dto.state ?? company.address?.state,
        postalCode: dto.postalCode ?? company.address?.postalCode,
        country: dto.country ?? company.address?.country,
      };
    }

    // Update social profiles
    if (
      dto.linkedin !== undefined ||
      dto.twitter !== undefined ||
      dto.facebook !== undefined
    ) {
      company.socialProfiles = {
        ...(company.socialProfiles || {}),
        linkedin: dto.linkedin ?? company.socialProfiles?.linkedin,
        twitter: dto.twitter ?? company.socialProfiles?.twitter,
        facebook: dto.facebook ?? company.socialProfiles?.facebook,
      };
    }

    // Update other fields
    Object.assign(company, {
      name: dto.name ?? company.name,
      domain: dto.domain ?? company.domain,
      website: dto.website ?? company.website,
      phone: dto.phone ?? company.phone,
      email: dto.email ?? company.email,
      industry: dto.industry ?? company.industry,
      companySize: dto.companySize ?? company.companySize,
      employeeCount: dto.employeeCount ?? company.employeeCount,
      annualRevenue: dto.annualRevenue ?? company.annualRevenue,
      currency: dto.currency ?? company.currency,
      description: dto.description ?? company.description,
      logo: dto.logo ?? company.logo,
      isCustomer: dto.isCustomer ?? company.isCustomer,
    });

    const updated = await this.companyRepository.save(company);
    return this.findOne(tenantId, updated.id);
  }

  /**
   * Soft delete company
   */
  async remove(tenantId: string, id: string) {
    const company = await this.companyRepository.findOne({
      where: { id, tenantId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if company has associated contacts, leads, or deals
    const contactCount = await this.contactRepository.count({
      where: { companyId: id },
    });

    const leadCount = await this.leadRepository.count({
      where: { companyId: id },
    });

    const dealCount = await this.dealRepository.count({
      where: { companyId: id },
    });

    if (contactCount > 0 || leadCount > 0 || dealCount > 0) {
      throw new BadRequestException(
        `Cannot delete company with ${contactCount} contacts, ${leadCount} leads, and ${dealCount} deals. Please reassign or delete them first.`,
      );
    }

    await this.companyRepository.softDelete(id);

    return { message: 'Company deleted successfully' };
  }

  /**
   * Restore soft-deleted company
   */
  async restore(tenantId: string, id: string) {
    const company = await this.companyRepository.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepository.restore(id);

    return this.findOne(tenantId, id);
  }

  /**
   * Get company statistics
   */
  async getStats(tenantId: string) {
    const total = await this.companyRepository.count({ where: { tenantId } });
    const customers = await this.companyRepository.count({
      where: { tenantId, isCustomer: true },
    });

    // Count by industry
    const industryStats = await this.companyRepository
      .createQueryBuilder('company')
      .select('company.industry', 'industry')
      .addSelect('COUNT(*)', 'count')
      .where('company.tenantId = :tenantId', { tenantId })
      .andWhere('company.industry IS NOT NULL')
      .groupBy('company.industry')
      .getRawMany();

    // Count by size
    const sizeStats = await this.companyRepository
      .createQueryBuilder('company')
      .select('company.companySize', 'size')
      .addSelect('COUNT(*)', 'count')
      .where('company.tenantId = :tenantId', { tenantId })
      .andWhere('company.companySize IS NOT NULL')
      .groupBy('company.companySize')
      .getRawMany();

    return {
      total,
      customers,
      byIndustry: industryStats.reduce((acc, item) => {
        acc[item.industry] = parseInt(item.count, 10);
        return acc;
      }, {}),
      bySize: sizeStats.reduce((acc, item) => {
        acc[item.size] = parseInt(item.count, 10);
        return acc;
      }, {}),
    };
  }

  /**
   * Get company contacts
   */
  async getCompanyContacts(tenantId: string, companyId: string) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId, tenantId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const contacts = await this.contactRepository.find({
      where: { companyId, tenantId },
      order: { createdAt: 'DESC' },
    });

    return contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.jobTitle,
      department: contact.department,
      createdAt: contact.createdAt,
    }));
  }

  /**
   * Get company leads
   */
  async getCompanyLeads(tenantId: string, companyId: string) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId, tenantId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const leads = await this.leadRepository.find({
      where: { companyId, tenantId },
      order: { createdAt: 'DESC' },
    });

    return leads.map((lead) => ({
      id: lead.id,
      title: lead.title,
      status: lead.status,
      source: lead.source,
      score: lead.score,
      estimatedValue: lead.estimatedValue,
      createdAt: lead.createdAt,
    }));
  }

  /**
   * Get company deals
   */
  async getCompanyDeals(tenantId: string, companyId: string) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId, tenantId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const deals = await this.dealRepository.find({
      where: { companyId, tenantId },
      order: { createdAt: 'DESC' },
    });

    return deals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      status: deal.status,
      amount: deal.amount,
      currency: deal.currency,
      closeDate: deal.actualCloseDate,
      createdAt: deal.createdAt,
    }));
  }

  // ========== HELPER METHODS ==========

  private async handleCustomFields(
    tenantId: string,
    companyId: string,
    customFields: Record<string, any>,
    entityType: string,
  ) {
    const fields = await this.customFieldRepository.find({
      where: { tenantId, entityType },
    });

    // Delete existing custom field values
    await this.customFieldValueRepository.delete({ companyId });

    const valuesToSave: CustomFieldValue[] = [];

    for (const [key, value] of Object.entries(customFields)) {
      const field = fields.find((f) => f.key === key);
      if (!field) continue;

      const cfv = this.customFieldValueRepository.create({
        fieldId: field.id,
        companyId,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      });

      valuesToSave.push(cfv);
    }

    if (valuesToSave.length > 0) {
      await this.customFieldValueRepository.save(valuesToSave);
    }
  }

  private formatCompanyResponse(company: Company) {
    return {
      id: company.id,
      tenantId: company.tenantId,
      name: company.name,
      domain: company.domain,
      website: company.website,
      phone: company.phone,
      email: company.email,
      industry: company.industry,
      companySize: company.companySize,
      employeeCount: company.employeeCount,
      annualRevenue: company.annualRevenue,
      currency: company.currency,
      description: company.description,
      address: company.address,
      fullAddress: company.fullAddress,
      socialProfiles: company.socialProfiles,
      logo: company.logo,
      isCustomer: company.isCustomer,
      tags: company.tags || [],
      customFields: company.customFieldValues
        ? company.customFieldValues.reduce((acc, cfv) => {
            acc[cfv.field.key] = cfv.value;
            return acc;
          }, {} as Record<string, any>)
        : company.customFields || {},
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}