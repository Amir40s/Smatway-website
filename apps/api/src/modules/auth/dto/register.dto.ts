export class RegisterDto {
  email!: string;
  password!: string;
  name?: string;
  accountType?: 'TRAVELER' | 'TRANSPORTER';
  phoneNumber?: string;
  country?: string;
  preferredCurrency?: string; // ISO 4217 code
}
