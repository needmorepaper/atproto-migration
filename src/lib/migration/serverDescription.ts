export class ServerDescription {
  private readonly did: string;
  private readonly availableUserDomains: Record<string, number>;
  private readonly inviteCodeRequired: boolean;
  private readonly links: Record<string, string>;
  private readonly contact: Record<string, string>;

  constructor(data: {
    did: string;
    availableUserDomains: Record<string, number>;
    inviteCodeRequired: boolean;
    links: Record<string, string>;
    contact: Record<string, string>;
  }) {
    this.did = data.did;
    this.availableUserDomains = data.availableUserDomains;
    this.inviteCodeRequired = data.inviteCodeRequired;
    this.links = data.links;
    this.contact = data.contact;
  }

  getDid(): string {
    return this.did;
  }

  getAvailableUserDomains(): Record<string, number> {
    return this.availableUserDomains;
  }

  isInviteCodeRequired(): boolean {
    return this.inviteCodeRequired;
  }

  getLinks(): Record<string, string> {
    return this.links;
  }

  getContact(): Record<string, string> {
    return this.contact;
  }
} 