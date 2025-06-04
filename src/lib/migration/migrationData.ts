import { AtpAgent } from "@atproto/api";

export class MigrationData {
    private readonly oldPds: String;
    private readonly newPds: String;
    private readonly inviteCode: String | null;
    private readonly handle: String;
    private readonly email: String;
    private readonly password: String;

    constructor(oldPds: String, newPds: String, inviteCode: String | null, handle: String, email: String, password: String) {
        this.oldPds = oldPds;
        this.newPds = newPds;
        this.inviteCode = inviteCode;
        this.handle = handle;
        this.email = email;
        this.password = password;
    }

    public getOldPds(): String {
        return this.oldPds;
    }

    public getNewPds(): String {
        return this.newPds;
    }

    public getInviteCode(): String | null {
        return this.inviteCode;
    }

    public getHandle(): String {
        return this.handle;
    }

    public getEmail(): String {
        return this.email;
    }
    
    public getPassword(): String {
        return this.password;
    }
}