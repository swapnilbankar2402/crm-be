import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SubscriptionPlan, Tenant, TenantStatus, User } from 'src/common/entities';
import { CreateTenantDto, QueryTenantsDto, UpdateBillingDto, UpdateBrandingDto, UpdateSettingsDto, UpdateSubscriptionDto, UpdateTenantDto } from '../dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new tenant (Super Admin only)
   */
  async create(createTenantDto: CreateTenantDto) {
    // Check if slug already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug: createTenantDto.slug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Check if domain already exists (if provided)
    if (createTenantDto.domain) {
      const existingDomain = await this.tenantRepository.findOne({
        where: { domain: createTenantDto.domain },
      });

      if (existingDomain) {
        throw new ConflictException('Domain already in use');
      }
    }

    // Set limits based on plan
    const limits = this.getPlanLimits(
      createTenantDto.subscriptionPlan || SubscriptionPlan.FREE,
    );

    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      ...limits,
      status: TenantStatus.ACTIVE,
      enabledFeatures: this.getPlanFeatures(
        createTenantDto.subscriptionPlan || SubscriptionPlan.FREE,
      ),
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    return this.findOne(savedTenant.id);
  }

  /**
   * Find all tenants with filtering and pagination (Super Admin only)
   */
  async findAll(query: QueryTenantsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      plan,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.users', 'users');

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(tenant.name ILIKE :search OR tenant.slug ILIKE :search OR tenant.domain ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('tenant.status = :status', { status });
    }

    // Filter by plan
    if (plan) {
      queryBuilder.andWhere('tenant.subscriptionPlan = :plan', { plan });
    }

    // Sorting
    queryBuilder.orderBy(`tenant.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [tenants, total] = await queryBuilder.getManyAndCount();

    return {
      data: tenants.map((tenant) => this.formatTenantResponse(tenant)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one tenant by ID
   */
  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.formatTenantResponse(tenant);
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { slug },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.formatTenantResponse(tenant);
  }

  /**
   * Get current tenant info (for logged-in users)
   */
  async getCurrentTenant(tenantId: string) {
    return this.findOne(tenantId);
  }

  /**
   * Update tenant
   */
  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if domain is being changed and already exists
    if (updateTenantDto.domain && updateTenantDto.domain !== tenant.domain) {
      const existingDomain = await this.tenantRepository.findOne({
        where: { domain: updateTenantDto.domain },
      });

      if (existingDomain) {
        throw new ConflictException('Domain already in use');
      }
    }

    Object.assign(tenant, updateTenantDto);
    await this.tenantRepository.save(tenant);

    return this.findOne(id);
  }

  /**
   * Update tenant settings
   */
  async updateSettings(tenantId: string, updateSettingsDto: UpdateSettingsDto) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    tenant.settings = {
      ...tenant.settings,
      ...updateSettingsDto,
    };

    await this.tenantRepository.save(tenant);

    return this.findOne(tenantId);
  }

  /**
   * Update tenant branding
   */
  async updateBranding(tenantId: string, updateBrandingDto: UpdateBrandingDto) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    Object.assign(tenant, updateBrandingDto);
    await this.tenantRepository.save(tenant);

    return this.findOne(tenantId);
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const limits = this.getPlanLimits(updateSubscriptionDto.plan);
    const features = this.getPlanFeatures(updateSubscriptionDto.plan);

    tenant.subscriptionPlan = updateSubscriptionDto.plan;
    tenant.subscriptionStartedAt = new Date();
    tenant.enabledFeatures = features;

    if (updateSubscriptionDto.subscriptionEndsAt) {
      tenant.subscriptionEndsAt = new Date(updateSubscriptionDto.subscriptionEndsAt);
    }

    // Update limits
    Object.assign(tenant, limits);

    // If upgrading from trial, mark trial as ended
    if (tenant.status === TenantStatus.TRIAL) {
      tenant.status = TenantStatus.ACTIVE;
    }

    await this.tenantRepository.save(tenant);

    return this.findOne(id);
  }

  /**
   * Update billing information
   */
  async updateBilling(tenantId: string, updateBillingDto: UpdateBillingDto) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    Object.assign(tenant, updateBillingDto);
    await this.tenantRepository.save(tenant);

    return this.findOne(tenantId);
  }

  /**
   * Update tenant status
   */
  async updateStatus(id: string, status: TenantStatus) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    tenant.status = status;
    await this.tenantRepository.save(tenant);

    // If suspended or cancelled, we might want to disable all users
    if (status === TenantStatus.SUSPENDED || status === TenantStatus.CANCELLED) {
      await this.userRepository.update(
        { tenantId: id },
        { status: 'inactive' as any },
      );
    }

    return this.findOne(id);
  }

  /**
   * Mark onboarding step as completed
   */
  async completeOnboardingStep(tenantId: string, step: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    tenant.onboardingSteps = {
      ...tenant.onboardingSteps,
      [step]: true,
    };

    // Check if all steps are completed
    const allSteps = [
      'profileCompleted',
      'teamInvited',
      'firstLeadAdded',
      'pipelineConfigured',
      'integrationSetup',
    ];

    const allCompleted = allSteps.every((s) => tenant.onboardingSteps[s]);

    if (allCompleted) {
      tenant.onboardingCompleted = true;
    }

    await this.tenantRepository.save(tenant);

    return this.findOne(tenantId);
  }

  /**
   * Get tenant usage statistics
   */
  async getUsageStats(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Update current usage counts
    const userCount = await this.userRepository.count({
      where: { tenantId },
    });

    tenant.currentUsers = userCount;
    await this.tenantRepository.save(tenant);

    return {
      users: {
        current: tenant.currentUsers,
        max: tenant.maxUsers,
        percentage: tenant.usersPercentage,
        remaining: tenant.maxUsers - tenant.currentUsers,
      },
      leads: {
        current: tenant.currentLeads,
        max: tenant.maxLeads,
        percentage: tenant.leadsPercentage,
        remaining: tenant.maxLeads - tenant.currentLeads,
      },
      contacts: {
        current: tenant.currentContacts,
        max: tenant.maxContacts,
        percentage: tenant.contactsPercentage,
        remaining: tenant.maxContacts - tenant.currentContacts,
      },
      emails: {
        current: tenant.currentEmailsThisMonth,
        max: tenant.maxEmailsPerMonth,
        percentage: (tenant.currentEmailsThisMonth / tenant.maxEmailsPerMonth) * 100,
        remaining: tenant.maxEmailsPerMonth - tenant.currentEmailsThisMonth,
      },
      storage: {
        current: tenant.currentStorageGB,
        max: tenant.maxStorageGB,
        percentage: tenant.storagePercentage,
        remaining: tenant.maxStorageGB - tenant.currentStorageGB,
        unit: 'GB',
      },
    };
  }

  /**
   * Get tenant analytics
   */
  async getAnalytics(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Calculate tenant age
    const createdDate = new Date(tenant.createdAt);
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      tenantAge: {
        days: ageInDays,
        months: Math.floor(ageInDays / 30),
      },
      subscription: {
        plan: tenant.subscriptionPlan,
        status: tenant.status,
        daysUntilTrialExpires: tenant.daysUntilTrialExpires,
        isTrialExpired: tenant.isTrialExpired,
        isSubscriptionActive: tenant.isSubscriptionActive,
      },
      limits: {
        isNearUserLimit: tenant.isNearUserLimit,
        isNearLeadLimit: tenant.isNearLeadLimit,
      },
      onboarding: {
        completed: tenant.onboardingCompleted,
        steps: tenant.onboardingSteps,
      },
    };
  }

  /**
   * Delete tenant (Super Admin only - soft delete)
   */
  async remove(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenantRepository.softDelete(id);

    return { message: 'Tenant deleted successfully' };
  }

  /**
   * Get plan limits based on subscription plan
   */
  private getPlanLimits(plan: SubscriptionPlan) {
    const limits = {
      [SubscriptionPlan.FREE]: {
        maxUsers: 2,
        maxLeads: 100,
        maxContacts: 100,
        maxEmailsPerMonth: 500,
        maxStorageGB: 1,
      },
      [SubscriptionPlan.STARTER]: {
        maxUsers: 5,
        maxLeads: 1000,
        maxContacts: 1000,
        maxEmailsPerMonth: 5000,
        maxStorageGB: 5,
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        maxUsers: 20,
        maxLeads: 10000,
        maxContacts: 10000,
        maxEmailsPerMonth: 50000,
        maxStorageGB: 50,
      },
      [SubscriptionPlan.ENTERPRISE]: {
        maxUsers: 100,
        maxLeads: 100000,
        maxContacts: 100000,
        maxEmailsPerMonth: 500000,
        maxStorageGB: 500,
      },
    };

    return limits[plan];
  }

  /**
   * Get plan features based on subscription plan
   */
  private getPlanFeatures(plan: SubscriptionPlan) {
    const features = {
      [SubscriptionPlan.FREE]: {
        leads: true,
        contacts: true,
        deals: false,
        analytics: false,
        emailTracking: false,
        apiAccess: false,
        customFields: false,
        automation: false,
        reporting: false,
        webhooks: false,
      },
      [SubscriptionPlan.STARTER]: {
        leads: true,
        contacts: true,
        deals: true,
        analytics: true,
        emailTracking: true,
        apiAccess: false,
        customFields: true,
        automation: false,
        reporting: true,
        webhooks: false,
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        leads: true,
        contacts: true,
        deals: true,
        analytics: true,
        emailTracking: true,
        apiAccess: true,
        customFields: true,
        automation: true,
        reporting: true,
        webhooks: true,
      },
      [SubscriptionPlan.ENTERPRISE]: {
        leads: true,
        contacts: true,
        deals: true,
        analytics: true,
        emailTracking: true,
        apiAccess: true,
        customFields: true,
        automation: true,
        reporting: true,
        webhooks: true,
      },
    };

    return features[plan];
  }

  /**
   * Format tenant response
   */
  private formatTenantResponse(tenant: Tenant) {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      status: tenant.status,
      subscriptionPlan: tenant.subscriptionPlan,
      trialEndsAt: tenant.trialEndsAt,
      subscriptionStartedAt: tenant.subscriptionStartedAt,
      subscriptionEndsAt: tenant.subscriptionEndsAt,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      website: tenant.website,
      industry: tenant.industry,
      companySize: tenant.companySize,
      country: tenant.country,
      timezone: tenant.timezone,
      defaultLanguage: tenant.defaultLanguage,
      currency: tenant.currency,
      enabledFeatures: tenant.enabledFeatures,
      settings: tenant.settings,
      onboardingCompleted: tenant.onboardingCompleted,
      onboardingSteps: tenant.onboardingSteps,
      userCount: tenant.users?.length || 0,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      computed: {
        isActive: tenant.isActive,
        isTrialExpired: tenant.isTrialExpired,
        daysUntilTrialExpires: tenant.daysUntilTrialExpires,
        isSubscriptionActive: tenant.isSubscriptionActive,
        isNearUserLimit: tenant.isNearUserLimit,
        isNearLeadLimit: tenant.isNearLeadLimit,
      },
    };
  }
}