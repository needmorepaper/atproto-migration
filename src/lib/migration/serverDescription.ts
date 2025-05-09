export class ServerDescription {
  private readonly did: string;
  private readonly availableUserDomains: Record<number, string>;
  private readonly inviteCodeRequired: boolean;
  private readonly phoneVerificationRequired: boolean;
  private readonly links: Record<string, string>;
  private readonly contact: Record<string, string>;

  constructor(data: {
    did: string;
    availableUserDomains: Record<number, string>;
    inviteCodeRequired: boolean;
    phoneVerificationRequired?: boolean;
    links: Record<string, string>;
    contact: Record<string, string>;
  }) {
    this.did = data.did;
    this.availableUserDomains = data.availableUserDomains;
    this.inviteCodeRequired = data.inviteCodeRequired;
    this.phoneVerificationRequired = data.phoneVerificationRequired ?? false;
    this.links = data.links;
    this.contact = data.contact;
  }

  getDid(): string {
    return this.did;
  }

  getAvailableUserDomains(): Record<number, string> {
    return this.availableUserDomains;
  }

  isInviteCodeRequired(): boolean {
    return this.inviteCodeRequired;
  }

  isPhoneVerificationRequired(): boolean {
    return this.phoneVerificationRequired;
  }

  getLinks(): Record<string, string> {
    return this.links;
  }

  getContact(): Record<string, string> {
    return this.contact;
  }
} 