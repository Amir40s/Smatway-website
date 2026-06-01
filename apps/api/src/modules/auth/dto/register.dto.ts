export class RegisterDto {
  email!: string;
  password!: string;
  name?: string;
  businessName?: string; // Add businessName
  accountType?: 'TRAVELER' | 'TRANSPORTER';
  phoneNumber?: string;
  country?: string;
  preferredCurrency?: string; // ISO 4217 code
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolderName?: string;
  agreedToTerms?: boolean;
}
