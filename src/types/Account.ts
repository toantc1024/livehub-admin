// enum
export enum AccountRole {
    BUYER = 'BUYER',
    SUPPLIER = 'SUPPLIER',
    ADMIN = 'ADMIN',
}

export type AccountMetadata = {
    fullName: string;
    role: AccountRole;
    taxId: string;
    address: string;
}
