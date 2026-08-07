/**
 * Country dial codes for the phone field. India is the default because that is
 * where the product operates; the rest are present so nobody is blocked.
 *
 * `nsn` is the expected national-number length, used only as a soft hint —
 * Firebase does the authoritative validation when it sends the OTP.
 */
export interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
  nsn?: number;
}

export const DEFAULT_COUNTRY = 'IN';

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', nsn: 10 },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', nsn: 10 },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', nsn: 10 },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪', nsn: 9 },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬', nsn: 8 },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', nsn: 9 },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', nsn: 10 },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', nsn: 9 },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱', nsn: 9 },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳', nsn: 11 },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵', nsn: 10 },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰', nsn: 9 },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩', nsn: 10 },
  { code: 'BT', name: 'Bhutan', dial: '+975', flag: '🇧🇹' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰', nsn: 10 },
  { code: 'MV', name: 'Maldives', dial: '+960', flag: '🇲🇻' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦', nsn: 8 },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', nsn: 9 },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼', nsn: 8 },
  { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲', nsn: 8 },
  { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭', nsn: 8 },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭', nsn: 9 },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴', nsn: 8 },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰', nsn: 8 },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸', nsn: 9 },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹', nsn: 9 },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱', nsn: 9 },
  { code: 'CZ', name: 'Czechia', dial: '+420', flag: '🇨🇿', nsn: 9 },
  { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷', nsn: 10 },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺', nsn: 10 },
  { code: 'TR', name: 'Türkiye', dial: '+90', flag: '🇹🇷', nsn: 10 },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', nsn: 9 },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪', nsn: 9 },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', nsn: 10 },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', nsn: 9 },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴', nsn: 10 },
  { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪', nsn: 9 },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭', nsn: 9 },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭', nsn: 10 },
  { code: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰', nsn: 8 },
  { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
  { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱', nsn: 9 },
  { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦', nsn: 9 },
  { code: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴', nsn: 9 },
  { code: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
  { code: 'MU', name: 'Mauritius', dial: '+230', flag: '🇲🇺', nsn: 8 },
  { code: 'FJ', name: 'Fiji', dial: '+679', flag: '🇫🇯' },
  { code: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲' },
  { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
  { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
  { code: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧' },
  { code: 'KZ', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿' },
  { code: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
  { code: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲' },
  { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
  { code: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼' },
  { code: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
  { code: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳' },
  { code: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾' },
  { code: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩' },
  { code: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿' },
  { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
  { code: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷' },
  { code: 'RS', name: 'Serbia', dial: '+381', flag: '🇷🇸' },
  { code: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮' },
  { code: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
  { code: 'IS', name: 'Iceland', dial: '+354', flag: '🇮🇸' },
  { code: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', dial: '+356', flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
];

export const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function findCountry(code: string): Country {
  return COUNTRY_BY_CODE.get(code) ?? COUNTRIES[0]!;
}

export function searchCountries(query: string): Country[] {
  const q = query.trim().toLowerCase().replace(/^\+/, '');
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase() === q ||
      c.dial.replace('+', '').startsWith(q),
  );
}
