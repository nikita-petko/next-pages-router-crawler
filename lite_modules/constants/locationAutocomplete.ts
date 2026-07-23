import { RegionsAndLocationsFormInputObj } from '@type/locationAutocomplete';

export const AllLocationsObj = {
  countryCode: 'All',
  isAll: true,
  regionCode: 'All',
  superGroup: true,
  title: 'All Regions',
  value: 1,
};

export const allNonEULocationsObj = {
  countryCode: 'AllNonEU',
  regionCode: 'AllNonEU',
  title: 'All Non-EU Regions',
  value: 50,
};

export const RegionsAndCountriesSortedAlph: RegionsAndLocationsFormInputObj[] = [
  { ...AllLocationsObj, superGroup: true },
  { ...allNonEULocationsObj, superGroup: true },
  // US AND CANADA
  { nonEU: true, parentRegion: true, regionCode: 'UAC', title: 'US and Canada', value: 19 },
  { countryCode: 'CA', regionCode: 'UAC', title: 'Canada', value: 4 },
  { countryCode: 'US', regionCode: 'UAC', title: 'United States', value: 2 },
  // AFRICA
  { nonEU: true, parentRegion: true, regionCode: 'AFRICA', title: 'Africa', value: 16 },
  { countryCode: 'DZ', regionCode: 'AFRICA', title: 'Algeria', value: 8 },
  { countryCode: 'AO', regionCode: 'AFRICA', title: 'Angola', value: 11 },
  { countryCode: 'BJ', regionCode: 'AFRICA', title: 'Benin', value: 28 },
  { countryCode: 'BW', regionCode: 'AFRICA', title: 'Botswana', value: 34 },
  { countryCode: 'IO', regionCode: 'AFRICA', title: 'British Indian Ocean Territory', value: 37 },
  { countryCode: 'BF', regionCode: 'AFRICA', title: 'Burkina Faso', value: 40 },
  { countryCode: 'BI', regionCode: 'AFRICA', title: 'Burundi', value: 41 },
  { countryCode: 'CV', regionCode: 'AFRICA', title: 'Cape Verde', value: 44 },
  { countryCode: 'CM', regionCode: 'AFRICA', title: 'Cameroon', value: 43 },
  { countryCode: 'CF', regionCode: 'AFRICA', title: 'Central African Republic', value: 46 },
  { countryCode: 'TD', regionCode: 'AFRICA', title: 'Chad', value: 47 },
  { countryCode: 'KM', regionCode: 'AFRICA', title: 'Comoros', value: 53 },
  { countryCode: 'CG', regionCode: 'AFRICA', title: 'Congo Republic', value: 54 },
  { countryCode: 'CI', regionCode: 'AFRICA', title: "Cote D'ivoire", value: 58 },
  { countryCode: 'CD', regionCode: 'AFRICA', title: 'DR Congo', value: 55 },
  { countryCode: 'DJ', regionCode: 'AFRICA', title: 'Djibouti', value: 65 },
  { countryCode: 'EG', regionCode: 'AFRICA', title: 'Egypt', value: 69 },
  { countryCode: 'GQ', regionCode: 'AFRICA', title: 'Equatorial Guinea', value: 71 },
  { countryCode: 'ER', regionCode: 'AFRICA', title: 'Eritrea', value: 72 },
  { countryCode: 'ET', regionCode: 'AFRICA', title: 'Ethiopia', value: 74 },
  { countryCode: 'GA', regionCode: 'AFRICA', title: 'Gabon', value: 83 },
  { countryCode: 'GM', regionCode: 'AFRICA', title: 'Gambia', value: 84 },
  { countryCode: 'GH', regionCode: 'AFRICA', title: 'Ghana', value: 87 },
  { countryCode: 'GN', regionCode: 'AFRICA', title: 'Guinea', value: 96 },
  { countryCode: 'GW', regionCode: 'AFRICA', title: 'Guinea-Bissau', value: 97 },
  { countryCode: 'KE', regionCode: 'AFRICA', title: 'Kenya', value: 118 },
  { countryCode: 'LS', regionCode: 'AFRICA', title: 'Lesotho', value: 127 },
  { countryCode: 'LR', regionCode: 'AFRICA', title: 'Liberia', value: 128 },
  { countryCode: 'LY', regionCode: 'AFRICA', title: 'Libya', value: 129 },
  { countryCode: 'MG', regionCode: 'AFRICA', title: 'Madagascar', value: 135 },
  { countryCode: 'MW', regionCode: 'AFRICA', title: 'Malawi', value: 136 },
  { countryCode: 'ML', regionCode: 'AFRICA', title: 'Mali', value: 139 },
  { countryCode: 'MR', regionCode: 'AFRICA', title: 'Mauritania', value: 143 },
  { countryCode: 'MU', regionCode: 'AFRICA', title: 'Mauritius', value: 144 },
  { countryCode: 'YT', regionCode: 'AFRICA', title: 'Mayotte', value: 145 },
  { countryCode: 'MA', regionCode: 'AFRICA', title: 'Morocco', value: 153 },
  { countryCode: 'MZ', regionCode: 'AFRICA', title: 'Mozambique', value: 154 },
  { countryCode: 'NA', regionCode: 'AFRICA', title: 'Namibia', value: 156 },
  { countryCode: 'NE', regionCode: 'AFRICA', title: 'Niger', value: 164 },
  { countryCode: 'NG', regionCode: 'AFRICA', title: 'Nigeria', value: 165 },
  { countryCode: 'RW', regionCode: 'AFRICA', title: 'Rwanda', value: 187 },
  { countryCode: 'RE', regionCode: 'AFRICA', title: 'Réunion', value: 184 },
  { countryCode: 'ST', regionCode: 'AFRICA', title: 'São Tomé and Príncipe', value: 197 },
  { countryCode: 'SN', regionCode: 'AFRICA', title: 'Senegal', value: 199 },
  { countryCode: 'SC', regionCode: 'AFRICA', title: 'Seychelles', value: 201 },
  { countryCode: 'SL', regionCode: 'AFRICA', title: 'Sierra Leone', value: 202 },
  { countryCode: 'SO', regionCode: 'AFRICA', title: 'Somalia', value: 208 },
  { countryCode: 'ZA', regionCode: 'AFRICA', title: 'South Africa', value: 209 },
  { countryCode: 'SS', regionCode: 'AFRICA', title: 'South Sudan', value: 211 },
  { countryCode: 'SZ', regionCode: 'AFRICA', title: 'Swaziland', value: 216 },
  { countryCode: 'TZ', regionCode: 'AFRICA', title: 'Tanzania', value: 221 },
  { countryCode: 'TG', regionCode: 'AFRICA', title: 'Togo', value: 224 },
  { countryCode: 'TN', regionCode: 'AFRICA', title: 'Tunisia', value: 228 },
  { countryCode: 'UG', regionCode: 'AFRICA', title: 'Uganda', value: 233 },
  { countryCode: 'EH', regionCode: 'AFRICA', title: 'Western Sahara', value: 245 },
  { countryCode: 'ZM', regionCode: 'AFRICA', title: 'Zambia', value: 247 },
  { countryCode: 'ZW', regionCode: 'AFRICA', title: 'Zimbabwe', value: 248 },
  {
    nonEU: true,
    parentRegion: true,
    regionCode: 'ANZ',
    title: 'Australia and New Zealand',
    value: 17,
  },
  { countryCode: 'AU', regionCode: 'ANZ', title: 'Australia', value: 18 },
  { countryCode: 'NZ', regionCode: 'ANZ', title: 'New Zealand', value: 162 },
  // EASTERN EUROPE
  { parentRegion: true, regionCode: 'EASTERN_EUROPE', title: 'Eastern Europe', value: 11 },
  { countryCode: 'AL', regionCode: 'EASTERN_EUROPE', title: 'Albania', value: 7 },
  { countryCode: 'AM', regionCode: 'EASTERN_EUROPE', title: 'Armenia', value: 16 },
  { countryCode: 'AZ', regionCode: 'EASTERN_EUROPE', title: 'Azerbaijan', value: 20 },
  { countryCode: 'BY', regionCode: 'EASTERN_EUROPE', title: 'Belarus', value: 25 },
  { countryCode: 'BA', regionCode: 'EASTERN_EUROPE', title: 'Bosnia ', value: 33 },
  { countryCode: 'BG', regionCode: 'EASTERN_EUROPE', title: 'Bulgaria', value: 39 },
  { countryCode: 'CZ', regionCode: 'EASTERN_EUROPE', title: 'Czech Republic', value: 63 },
  { countryCode: 'EE', regionCode: 'EASTERN_EUROPE', title: 'Estonia', value: 73 },
  { countryCode: 'GE', regionCode: 'EASTERN_EUROPE', title: 'Georgia', value: 85 },
  { countryCode: 'HU', regionCode: 'EASTERN_EUROPE', title: 'Hungary', value: 104 },
  { countryCode: 'LV', regionCode: 'EASTERN_EUROPE', title: 'Latvia', value: 125 },
  { countryCode: 'ME', regionCode: 'EASTERN_EUROPE', title: 'Montenegro', value: 151 },
  { countryCode: 'PL', regionCode: 'EASTERN_EUROPE', title: 'Poland', value: 180 },
  { countryCode: 'LT', regionCode: 'EASTERN_EUROPE', title: 'Republic of Lithuania', value: 30 },
  { countryCode: 'MD', regionCode: 'EASTERN_EUROPE', title: 'Republic of Moldova', value: 148 },
  { countryCode: 'RO', regionCode: 'EASTERN_EUROPE', title: 'Romania', value: 185 },
  { countryCode: 'RU', regionCode: 'EASTERN_EUROPE', title: 'Russia', value: 186 },
  { countryCode: 'RS', regionCode: 'EASTERN_EUROPE', title: 'Serbia', value: 200 },
  { countryCode: 'SK', regionCode: 'EASTERN_EUROPE', title: 'Slovakia', value: 205 },
  { countryCode: 'SI', regionCode: 'EASTERN_EUROPE', title: 'Slovenia', value: 206 },
  { countryCode: 'TR', regionCode: 'EASTERN_EUROPE', title: 'Turkey', value: 229 },
  { countryCode: 'UA', regionCode: 'EASTERN_EUROPE', title: 'Ukraine', value: 234 },
  // MIDDLE EAST
  { nonEU: true, parentRegion: true, regionCode: 'MIDDLE_EAST', title: 'Middle East', value: 14 },
  { countryCode: 'BH', regionCode: 'MIDDLE_EAST', title: 'Bahrain', value: 22 },
  { countryCode: 'IR', regionCode: 'MIDDLE_EAST', title: 'Iran', value: 249 },
  { countryCode: 'IQ', regionCode: 'MIDDLE_EAST', title: 'Iraq', value: 108 },
  { countryCode: 'IL', regionCode: 'MIDDLE_EAST', title: 'Israel', value: 111 },
  { countryCode: 'KW', regionCode: 'MIDDLE_EAST', title: 'Kuwait', value: 122 },
  { countryCode: 'LB', regionCode: 'MIDDLE_EAST', title: 'Lebanon', value: 126 },
  { countryCode: 'OM', regionCode: 'MIDDLE_EAST', title: 'Oman', value: 170 },
  { countryCode: 'QA', regionCode: 'MIDDLE_EAST', title: 'Qatar', value: 183 },
  { countryCode: 'SA', regionCode: 'MIDDLE_EAST', title: 'Saudi Arabia', value: 198 },
  { countryCode: 'SY', regionCode: 'MIDDLE_EAST', title: 'Syria', value: 250 },
  { countryCode: 'AE', regionCode: 'MIDDLE_EAST', title: 'United Arab Emirates', value: 235 },
  { countryCode: 'YE', regionCode: 'MIDDLE_EAST', title: 'Yemen', value: 246 },
  // EAST ASIA
  { nonEU: true, parentRegion: true, regionCode: 'EAST_ASIA', title: 'East Asia', value: 12 },
  { countryCode: 'HK', regionCode: 'EAST_ASIA', title: 'Hong Kong', value: 103 },
  { countryCode: 'JP', regionCode: 'EAST_ASIA', title: 'Japan', value: 114 },
  { countryCode: 'MN', regionCode: 'EAST_ASIA', title: 'Mongolia', value: 150 },
  { countryCode: 'KP', regionCode: 'EAST_ASIA', title: 'North Korea', value: 251 },
  { countryCode: 'KR', regionCode: 'EAST_ASIA', title: 'South Korea', value: 120 },
  { countryCode: 'TW', regionCode: 'EAST_ASIA', title: 'Taiwan', value: 219 },
  // LATIN AMERICA
  {
    nonEU: true,
    parentRegion: true,
    regionCode: 'LATIN_AMERICA',
    title: 'Latin America',
    value: 15,
  },
  { countryCode: 'AI', regionCode: 'LATIN_AMERICA', title: 'Anguilla', value: 12 },
  { countryCode: 'AG', regionCode: 'LATIN_AMERICA', title: 'Antigua and Barbuda', value: 14 },
  { countryCode: 'AR', regionCode: 'LATIN_AMERICA', title: 'Argentina', value: 15 },
  { countryCode: 'AW', regionCode: 'LATIN_AMERICA', title: 'Aruba', value: 17 },
  { countryCode: 'BS', regionCode: 'LATIN_AMERICA', title: 'Bahamas', value: 21 },
  { countryCode: 'BB', regionCode: 'LATIN_AMERICA', title: 'Barbados', value: 24 },
  { countryCode: 'BZ', regionCode: 'LATIN_AMERICA', title: 'Belize', value: 27 },
  { countryCode: 'BM', regionCode: 'LATIN_AMERICA', title: 'Bermuda', value: 29 },
  { countryCode: 'BO', regionCode: 'LATIN_AMERICA', title: 'Bolivia', value: 31 },
  {
    countryCode: 'BQ',
    regionCode: 'LATIN_AMERICA',
    title: 'Bonaire, Saint Eustatius, and Saba',
    value: 32,
  },
  { countryCode: 'BV', regionCode: 'LATIN_AMERICA', title: 'Bouvet Island', value: 35 },
  { countryCode: 'BR', regionCode: 'LATIN_AMERICA', title: 'Brazil', value: 36 },
  { countryCode: 'VG', regionCode: 'LATIN_AMERICA', title: 'British Virgin Islands', value: 242 },
  { countryCode: 'KY', regionCode: 'LATIN_AMERICA', title: 'Cayman Islands', value: 45 },
  { countryCode: 'CL', regionCode: 'LATIN_AMERICA', title: 'Chile', value: 48 },
  { countryCode: 'CO', regionCode: 'LATIN_AMERICA', title: 'Colombia', value: 52 },
  { countryCode: 'CK', regionCode: 'LATIN_AMERICA', title: 'Cook Islands', value: 56 },
  { countryCode: 'CR', regionCode: 'LATIN_AMERICA', title: 'Costa Rica', value: 57 },
  { countryCode: 'CU', regionCode: 'LATIN_AMERICA', title: 'Cuba', value: 60 },
  { countryCode: 'CW', regionCode: 'LATIN_AMERICA', title: 'Curaçao', value: 61 },
  { countryCode: 'DM', regionCode: 'LATIN_AMERICA', title: 'Dominica', value: 66 },
  { countryCode: 'DO', regionCode: 'LATIN_AMERICA', title: 'Dominican Republic', value: 67 },
  { countryCode: 'EC', regionCode: 'LATIN_AMERICA', title: 'Ecuador', value: 68 },
  { countryCode: 'SV', regionCode: 'LATIN_AMERICA', title: 'El Salvador', value: 70 },
  { countryCode: 'FK', regionCode: 'LATIN_AMERICA', title: 'Falkland Islands', value: 75 },
  { countryCode: 'GF', regionCode: 'LATIN_AMERICA', title: 'French Guiana', value: 80 },
  { countryCode: 'GD', regionCode: 'LATIN_AMERICA', title: 'Grenada', value: 91 },
  { countryCode: 'GP', regionCode: 'LATIN_AMERICA', title: 'Guadeloupe', value: 92 },
  { countryCode: 'GT', regionCode: 'LATIN_AMERICA', title: 'Guatemala', value: 94 },
  { countryCode: 'GY', regionCode: 'LATIN_AMERICA', title: 'Guyana', value: 98 },
  { countryCode: 'HT', regionCode: 'LATIN_AMERICA', title: 'Haiti', value: 99 },
  { countryCode: 'HN', regionCode: 'LATIN_AMERICA', title: 'Honduras', value: 102 },
  { countryCode: 'JM', regionCode: 'LATIN_AMERICA', title: 'Jamaica', value: 113 },
  { countryCode: 'MQ', regionCode: 'LATIN_AMERICA', title: 'Martinique', value: 142 },
  { countryCode: 'MX', regionCode: 'LATIN_AMERICA', title: 'Mexico', value: 146 },
  { countryCode: 'MS', regionCode: 'LATIN_AMERICA', title: 'Montserrat', value: 152 },
  { countryCode: 'NI', regionCode: 'LATIN_AMERICA', title: 'Nicaragua', value: 163 },
  { countryCode: 'PA', regionCode: 'LATIN_AMERICA', title: 'Panama', value: 174 },
  { countryCode: 'PY', regionCode: 'LATIN_AMERICA', title: 'Paraguay', value: 176 },
  { countryCode: 'PE', regionCode: 'LATIN_AMERICA', title: 'Peru', value: 177 },
  { countryCode: 'PR', regionCode: 'LATIN_AMERICA', title: 'Puerto Rico', value: 182 },
  { countryCode: 'BL', regionCode: 'LATIN_AMERICA', title: 'Saint Barthélemy', value: 188 },
  { countryCode: 'SH', regionCode: 'LATIN_AMERICA', title: 'Saint Helena', value: 189 },
  { countryCode: 'LC', regionCode: 'LATIN_AMERICA', title: 'Saint Lucia', value: 191 },
  { countryCode: 'MF', regionCode: 'LATIN_AMERICA', title: 'Saint Martin', value: 192 },
  {
    countryCode: 'PM',
    regionCode: 'LATIN_AMERICA',
    title: 'Saint Pierre and Miquelon',
    value: 193,
  },
  {
    countryCode: 'VC',
    regionCode: 'LATIN_AMERICA',
    title: 'Saint Vincent and the Grenadines',
    value: 194,
  },
  { countryCode: 'SX', regionCode: 'LATIN_AMERICA', title: 'Sint Maarten', value: 204 },
  {
    countryCode: 'GS',
    regionCode: 'LATIN_AMERICA',
    title: 'South Georgia and the South Sandwich Islands',
    value: 210,
  },
  { countryCode: 'KN', regionCode: 'LATIN_AMERICA', title: 'St Kitts and Nevis', value: 190 },
  { countryCode: 'SR', regionCode: 'LATIN_AMERICA', title: 'Suriname', value: 214 },
  { countryCode: 'TT', regionCode: 'LATIN_AMERICA', title: 'Trinidad and Tobago', value: 227 },
  { countryCode: 'TC', regionCode: 'LATIN_AMERICA', title: 'Turks and Caicos Islands', value: 231 },
  { countryCode: 'VI', regionCode: 'LATIN_AMERICA', title: 'U.S. Virgin Islands', value: 243 },
  { countryCode: 'UY', regionCode: 'LATIN_AMERICA', title: 'Uruguay', value: 237 },
  { countryCode: 'VE', regionCode: 'LATIN_AMERICA', title: 'Venezuela', value: 240 },
  // REST OF THE WORLD
  { nonEU: true, parentRegion: true, regionCode: 'ROW', title: 'Rest of the World', value: 18 },
  { countryCode: 'AF', regionCode: 'ROW', title: 'Afghanistan', value: 5 },
  { countryCode: 'AS', regionCode: 'ROW', title: 'American Samoa', value: 9 },
  { countryCode: 'BD', regionCode: 'ROW', title: 'Bangladesh', value: 23 },
  { countryCode: 'BT', regionCode: 'ROW', title: 'Bhutan', value: 30 },
  { countryCode: 'CC', regionCode: 'ROW', title: 'Cocos [Keeling] Islands', value: 51 },
  { countryCode: 'PF', regionCode: 'ROW', title: 'French Polynesia', value: 81 },
  { countryCode: 'GU', regionCode: 'ROW', title: 'Guam', value: 93 },
  { countryCode: 'IN', regionCode: 'ROW', title: 'India', value: 106 },
  { countryCode: 'KZ', regionCode: 'ROW', title: 'Kazakhstan', value: 117 },
  { countryCode: 'KI', regionCode: 'ROW', title: 'Kiribati', value: 119 },
  { countryCode: 'KG', regionCode: 'ROW', title: 'Kyrgyzstan', value: 123 },
  { countryCode: 'MH', regionCode: 'ROW', title: 'Marshall Islands', value: 141 },
  { countryCode: 'NR', regionCode: 'ROW', title: 'Nauru', value: 157 },
  { countryCode: 'NP', regionCode: 'ROW', title: 'Nepal', value: 158 },
  { countryCode: 'NC', regionCode: 'ROW', title: 'New Caledonia', value: 161 },
  { countryCode: 'NU', regionCode: 'ROW', title: 'Niue', value: 166 },
  { countryCode: 'NF', regionCode: 'ROW', title: 'Norfolk Island', value: 167 },
  { countryCode: 'MP', regionCode: 'ROW', title: 'Northern Mariana Islands', value: 168 },
  { countryCode: 'PK', regionCode: 'ROW', title: 'Pakistan', value: 171 },
  { countryCode: 'PW', regionCode: 'ROW', title: 'Palau', value: 172 },
  { countryCode: 'PG', regionCode: 'ROW', title: 'Papua New Guinea', value: 175 },
  { countryCode: 'PN', regionCode: 'ROW', title: 'Pitcairn', value: 179 },
  { countryCode: 'WS', regionCode: 'ROW', title: 'Samoa', value: 195 },
  { countryCode: 'SB', regionCode: 'ROW', title: 'Solomon Islands', value: 207 },
  { countryCode: 'LK', regionCode: 'ROW', title: 'Sri Lanka', value: 213 },
  { countryCode: 'TJ', regionCode: 'ROW', title: 'Tajikistan', value: 220 },
  { countryCode: 'TK', regionCode: 'ROW', title: 'Tokelau', value: 225 },
  { countryCode: 'TO', regionCode: 'ROW', title: 'Tonga', value: 226 },
  { countryCode: 'TM', regionCode: 'ROW', title: 'Turkmenistan', value: 230 },
  { countryCode: 'TV', regionCode: 'ROW', title: 'Tuvalu', value: 232 },
  { countryCode: 'UM', regionCode: 'ROW', title: 'U.S. Minor Outlying Islands', value: 236 },
  { countryCode: 'UZ', regionCode: 'ROW', title: 'Uzbekistan', value: 238 },
  { countryCode: 'VU', regionCode: 'ROW', title: 'Vanuatu', value: 239 },
  { countryCode: 'WF', regionCode: 'ROW', title: 'Wallis and Futuna', value: 244 },
  // SOUTHEAST ASIA
  {
    nonEU: true,
    parentRegion: true,
    regionCode: 'SOUTHEAST_ASIA',
    title: 'Southeast Asia',
    value: 13,
  },
  { countryCode: 'KH', regionCode: 'SOUTHEAST_ASIA', title: 'Cambodia', value: 42 },
  { countryCode: 'CX', regionCode: 'SOUTHEAST_ASIA', title: 'Christmas Island', value: 50 },
  { countryCode: 'TL', regionCode: 'SOUTHEAST_ASIA', title: 'Timor-leste', value: 223 },
  {
    countryCode: 'FM',
    regionCode: 'SOUTHEAST_ASIA',
    title: 'Federated States of Micronesia',
    value: 147,
  },
  { countryCode: 'FJ', regionCode: 'SOUTHEAST_ASIA', title: 'Fiji', value: 77 },
  { countryCode: 'ID', regionCode: 'SOUTHEAST_ASIA', title: 'Indonesia', value: 107 },
  {
    countryCode: 'LA',
    regionCode: 'SOUTHEAST_ASIA',
    title: "Lao People's Democratic Republic",
    value: 124,
  },
  { countryCode: 'MO', regionCode: 'SOUTHEAST_ASIA', title: 'Macao', value: 133 },
  { countryCode: 'MY', regionCode: 'SOUTHEAST_ASIA', title: 'Malaysia', value: 137 },
  { countryCode: 'MV', regionCode: 'SOUTHEAST_ASIA', title: 'Maldives', value: 138 },
  { countryCode: 'MM', regionCode: 'SOUTHEAST_ASIA', title: 'Myanmar', value: 155 },
  { countryCode: 'PH', regionCode: 'SOUTHEAST_ASIA', title: 'Philippines', value: 178 },
  { countryCode: 'SG', regionCode: 'SOUTHEAST_ASIA', title: 'Singapore', value: 203 },
  { countryCode: 'TH', regionCode: 'SOUTHEAST_ASIA', title: 'Thailand', value: 222 },
  { countryCode: 'VN', regionCode: 'SOUTHEAST_ASIA', title: 'Vietnam', value: 241 },
  // WESTERN EUROPE
  { parentRegion: true, regionCode: 'WESTERN_EUROPE', title: 'Western Europe', value: 10 },
  { countryCode: 'AX', regionCode: 'WESTERN_EUROPE', title: 'Åland Islands', value: 6 },
  { countryCode: 'AD', regionCode: 'WESTERN_EUROPE', title: 'Andorra', value: 10 },
  { countryCode: 'AT', regionCode: 'WESTERN_EUROPE', title: 'Austria', value: 19 },
  { countryCode: 'BE', regionCode: 'WESTERN_EUROPE', title: 'Belgium', value: 26 },
  { countryCode: 'HR', regionCode: 'WESTERN_EUROPE', title: 'Croatia', value: 59 },
  { countryCode: 'CY', regionCode: 'WESTERN_EUROPE', title: 'Cyprus', value: 62 },
  { countryCode: 'DK', regionCode: 'WESTERN_EUROPE', title: 'Denmark', value: 64 },
  { countryCode: 'FO', regionCode: 'WESTERN_EUROPE', title: 'Faroe Islands', value: 76 },
  { countryCode: 'FI', regionCode: 'WESTERN_EUROPE', title: 'Finland', value: 78 },
  { countryCode: 'FR', regionCode: 'WESTERN_EUROPE', title: 'France', value: 79 },
  { countryCode: 'DE', regionCode: 'WESTERN_EUROPE', title: 'Germany', value: 86 },
  { countryCode: 'GI', regionCode: 'WESTERN_EUROPE', title: 'Gibraltar', value: 88 },
  { countryCode: 'GR', regionCode: 'WESTERN_EUROPE', title: 'Greece', value: 89 },
  { countryCode: 'GL', regionCode: 'WESTERN_EUROPE', title: 'Greenland', value: 90 },
  { countryCode: 'GG', regionCode: 'WESTERN_EUROPE', title: 'Guernsey', value: 95 },
  { countryCode: 'IS', regionCode: 'WESTERN_EUROPE', title: 'Iceland', value: 105 },
  { countryCode: 'IE', regionCode: 'WESTERN_EUROPE', title: 'Ireland', value: 109 },
  { countryCode: 'IM', regionCode: 'WESTERN_EUROPE', title: 'Isle of Man', value: 110 },
  { countryCode: 'IT', regionCode: 'WESTERN_EUROPE', title: 'Italy', value: 112 },
  { countryCode: 'JE', regionCode: 'WESTERN_EUROPE', title: 'Jersey', value: 115 },
  { countryCode: 'LI', regionCode: 'WESTERN_EUROPE', title: 'Liechtenstein', value: 130 },
  { countryCode: 'LU', regionCode: 'WESTERN_EUROPE', title: 'Luxembourg', value: 132 },
  { countryCode: 'MT', regionCode: 'WESTERN_EUROPE', title: 'Malta', value: 140 },
  { countryCode: 'MC', regionCode: 'WESTERN_EUROPE', title: 'Monaco', value: 149 },
  { countryCode: 'NL', regionCode: 'WESTERN_EUROPE', title: 'Netherlands', value: 159 },
  { countryCode: 'NO', regionCode: 'WESTERN_EUROPE', title: 'Norway', value: 169 },
  { countryCode: 'PT', regionCode: 'WESTERN_EUROPE', title: 'Portugal', value: 181 },
  { countryCode: 'SM', regionCode: 'WESTERN_EUROPE', title: 'San Marino', value: 196 },
  { countryCode: 'ES', regionCode: 'WESTERN_EUROPE', title: 'Spain', value: 212 },
  { countryCode: 'SJ', regionCode: 'WESTERN_EUROPE', title: 'Svalbard and Jan Mayen', value: 215 },
  { countryCode: 'SE', regionCode: 'WESTERN_EUROPE', title: 'Sweden', value: 217 },
  { countryCode: 'CH', regionCode: 'WESTERN_EUROPE', title: 'Switzerland', value: 218 },
  {
    countryCode: 'GB',
    regionCode: 'WESTERN_EUROPE',
    title: 'United Kingdom',
    value: 3,
  },
  { countryCode: 'VA', regionCode: 'WESTERN_EUROPE', title: 'Vatican City', value: 101 },
];

export enum RowType {
  COUNTRY = 'COUNTRY',
  REGION = 'REGION',
  SUPER_GROUP = 'SUPER_GROUP',
}

export enum CheckboxState {
  CHECKED = 'CHECKED',
  PARTIAL = 'PARTIAL',
  UNCHECKED = 'UNCHECKED',
}

export enum ServerRegionCode {
  // Do not use.
  // UNSPECIFIED value.
  VALUE_UNSPECIFIED = 0,

  // All countries.
  VALUE_ALL = 1,

  // United States.
  VALUE_US = 2,

  // Canada.
  VALUE_CA = 3,

  // United Kingdom
  VALUE_GB = 4,

  // Germany
  VALUE_DE = 5,

  // France.
  VALUE_FR = 6,

  // South Korea
  VALUE_KR = 7,

  // Japan
  VALUE_JP = 8,

  // Brazil
  VALUE_BR = 9,

  // Western Europe
  VALUE_WESTERN_EUROPE = 10,

  // Eastern Europe
  VALUE_EASTERN_EUROPE = 11,

  // East Asia
  VALUE_EAST_ASIA = 12,

  // Southeast Asia
  VALUE_SOUTHEAST_ASIA = 13,

  // Middle East
  VALUE_MIDDLE_EAST = 14,

  // Latin America
  VALUE_LATIN_AMERICA = 15,

  // Africa
  VALUE_AFRICA = 16,

  // Australia and New Zealand
  VALUE_ANZ = 17,

  // Rest of the world
  VALUE_ROW = 18,

  // US and Canada
  VALUE_UAC = 19,
}

// ISO 3166 country code standards.
export enum ServerCountryCode {
  // Do not use.
  // UNSPECIFIED value.
  VALUE_UNSPECIFIED = 0,

  // All countries.
  VALUE_ALL = 1,

  // United States.
  VALUE_US = 2,

  // United Kingdom.
  VALUE_GB = 3,

  // Canada.
  VALUE_CA = 4,

  // Afghanistan.
  VALUE_AF = 5,

  // Aland Islands.
  VALUE_AX = 6,

  // Albania.
  VALUE_AL = 7,

  // Algeria.
  VALUE_DZ = 8,

  // American Samoa.
  VALUE_AS = 9,

  // Andorra.
  VALUE_AD = 10,

  // Angola.
  VALUE_AO = 11,

  // Anguilla.
  VALUE_AI = 12,

  // Antarctica.
  VALUE_AQ = 13,

  // Antigua and Barbuda.
  VALUE_AG = 14,

  // Argentina.
  VALUE_AR = 15,

  // Armenia.
  VALUE_AM = 16,

  // Aruba.
  VALUE_AW = 17,

  // Australia.
  VALUE_AU = 18,

  // Austria.
  VALUE_AT = 19,

  // Azerbaijan.
  VALUE_AZ = 20,

  // Bahamas, The.
  VALUE_BS = 21,

  // Bahrain.
  VALUE_BH = 22,

  // Bangladesh.
  VALUE_BD = 23,

  // Barbados.
  VALUE_BB = 24,

  // Belarus.
  VALUE_BY = 25,

  // Belgium.
  VALUE_BE = 26,

  // Belize.
  VALUE_BZ = 27,

  // Benin.
  VALUE_BJ = 28,

  // Bermuda.
  VALUE_BM = 29,

  // Bhutan.
  VALUE_BT = 30,

  // Bolivia.
  VALUE_BO = 31,

  // Bonaire, Saint Eustatius and Saba.
  VALUE_BQ = 32,

  // Bosnia and Herzegovina.
  VALUE_BA = 33,

  // Botswana.
  VALUE_BW = 34,

  // Bouvet Island.
  VALUE_BV = 35,

  // Brazil.
  VALUE_BR = 36,

  // British Indian Ocean Territory.
  VALUE_IO = 37,

  // Brunei Darussalam.
  VALUE_BN = 38,

  // Bulgaria.
  VALUE_BG = 39,

  // Burkina Faso.
  VALUE_BF = 40,

  // Burundi.
  VALUE_BI = 41,

  // Cambodia.
  VALUE_KH = 42,

  // Cameroon.
  VALUE_CM = 43,

  // Cape Verde.
  VALUE_CV = 44,

  // Cayman Islands.
  VALUE_KY = 45,

  // Central African Republic.
  VALUE_CF = 46,

  // Chad.
  VALUE_TD = 47,

  // Chile.
  VALUE_CL = 48,

  // China.
  VALUE_CN = 49,

  // Christmas Island.
  VALUE_CX = 50,

  // Cocos (Keeling) Islands.
  VALUE_CC = 51,

  // Colombia.
  VALUE_CO = 52,

  // Comoros.
  VALUE_KM = 53,

  // Congo.
  VALUE_CG = 54,

  // Congo, The Democratic Republic of the.
  VALUE_CD = 55,

  // Cook Islands.
  VALUE_CK = 56,

  // Costa Rica.
  VALUE_CR = 57,

  // Cote D'ivoire.
  VALUE_CI = 58,

  // Croatia.
  VALUE_HR = 59,

  // Cuba.
  VALUE_CU = 60,

  // Curaçao.
  VALUE_CW = 61,

  // Cyprus.
  VALUE_CY = 62,

  // Czech Republic.
  VALUE_CZ = 63,

  // Denmark.
  VALUE_DK = 64,

  // Djibouti.
  VALUE_DJ = 65,

  // Dominica.
  VALUE_DM = 66,

  // Dominican Republic.
  VALUE_DO = 67,

  // Ecuador.
  VALUE_EC = 68,

  // Egypt.
  VALUE_EG = 69,

  // El Salvador.
  VALUE_SV = 70,

  // Equatorial Guinea.
  VALUE_GQ = 71,

  // Eritrea.
  VALUE_ER = 72,

  // Estonia.
  VALUE_EE = 73,

  // Ethiopia.
  VALUE_ET = 74,

  // Falkland Islands (Malvinas).
  VALUE_FK = 75,

  // Faroe Islands.
  VALUE_FO = 76,

  // Fiji.
  VALUE_FJ = 77,

  // Finland.
  VALUE_FI = 78,

  // France.
  VALUE_FR = 79,

  // French Guiana.
  VALUE_GF = 80,

  // French Polynesia.
  VALUE_PF = 81,

  // French Southern Territories.
  VALUE_TF = 82,

  // Gabon.
  VALUE_GA = 83,

  // Gambia, The.
  VALUE_GM = 84,

  // Georgia.
  VALUE_GE = 85,

  // Germany.
  VALUE_DE = 86,

  // Ghana.
  VALUE_GH = 87,

  // Gibraltar.
  VALUE_GI = 88,

  // Greece.
  VALUE_GR = 89,

  // Greenland.
  VALUE_GL = 90,

  // Grenada.
  VALUE_GD = 91,

  // Guadeloupe.
  VALUE_GP = 92,

  // Guam.
  VALUE_GU = 93,

  // Guatemala.
  VALUE_GT = 94,

  // Guernsey.
  VALUE_GG = 95,

  // Guinea.
  VALUE_GN = 96,

  // Guinea-Bissau.
  VALUE_GW = 97,

  // Guyana.
  VALUE_GY = 98,

  // Haiti.
  VALUE_HT = 99,

  // Heard Island and the McDonald Islands.
  VALUE_HM = 100,

  // Holy See.
  VALUE_VA = 101,

  // Honduras.
  VALUE_HN = 102,

  // Hong Kong.
  VALUE_HK = 103,

  // Hungary.
  VALUE_HU = 104,

  // Iceland.
  VALUE_IS = 105,

  // India.
  VALUE_IN = 106,

  // Indonesia.
  VALUE_ID = 107,

  // Iraq.
  VALUE_IQ = 108,

  // Ireland.
  VALUE_IE = 109,

  // Isle of Man.
  VALUE_IM = 110,

  // Israel.
  VALUE_IL = 111,

  // Italy.
  VALUE_IT = 112,

  // Jamaica.
  VALUE_JM = 113,

  // Japan.
  VALUE_JP = 114,

  // Jersey.
  VALUE_JE = 115,

  // Jordan.
  VALUE_JO = 116,

  // Kazakhstan.
  VALUE_KZ = 117,

  // Kenya.
  VALUE_KE = 118,

  // Kiribati.
  VALUE_KI = 119,

  // Korea, Republic of.
  VALUE_KR = 120,

  // Kosovo.
  VALUE_XK = 121,

  // Kuwait.
  VALUE_KW = 122,

  // Kyrgyzstan.
  VALUE_KG = 123,

  // Lao People's Democratic Republic.
  VALUE_LA = 124,

  // Latvia.
  VALUE_LV = 125,

  // Lebanon.
  VALUE_LB = 126,

  // Lesotho.
  VALUE_LS = 127,

  // Liberia.
  VALUE_LR = 128,

  // Libya.
  VALUE_LY = 129,

  // Liechtenstein.
  VALUE_LI = 130,

  // Lithuania.
  VALUE_LT = 131,

  // Luxembourg.
  VALUE_LU = 132,

  // Macao.
  VALUE_MO = 133,

  // Macedonia, The Former Yugoslav Republic of.
  VALUE_MK = 134,

  // Madagascar.
  VALUE_MG = 135,

  // Malawi.
  VALUE_MW = 136,

  // Malaysia.
  VALUE_MY = 137,

  // Maldives.
  VALUE_MV = 138,

  // Mali.
  VALUE_ML = 139,

  // Malta.
  VALUE_MT = 140,

  // Marshall Islands.
  VALUE_MH = 141,

  // Martinique.
  VALUE_MQ = 142,

  // Mauritania.
  VALUE_MR = 143,

  // Mauritius.
  VALUE_MU = 144,

  // Mayotte.
  VALUE_YT = 145,

  // Mexico.
  VALUE_MX = 146,

  // Micronesia, Federated States of.
  VALUE_FM = 147,

  // Moldova, Republic of.
  VALUE_MD = 148,

  // Monaco.
  VALUE_MC = 149,

  // Mongolia.
  VALUE_MN = 150,

  // Montenegro.
  VALUE_ME = 151,

  // Montserrat.
  VALUE_MS = 152,

  // Morocco.
  VALUE_MA = 153,

  // Mozambique.
  VALUE_MZ = 154,

  // Myanmar.
  VALUE_MM = 155,

  // Namibia.
  VALUE_NA = 156,

  // Nauru.
  VALUE_NR = 157,

  // Nepal.
  VALUE_NP = 158,

  // Netherlands.
  VALUE_NL = 159,

  // Netherlands Antilles.
  VALUE_AN = 160,

  // New Caledonia.
  VALUE_NC = 161,

  // New Zealand.
  VALUE_NZ = 162,

  // Nicaragua.
  VALUE_NI = 163,

  // Niger.
  VALUE_NE = 164,

  // Nigeria.
  VALUE_NG = 165,

  // Niue.
  VALUE_NU = 166,

  // Norfolk Island.
  VALUE_NF = 167,

  // Northern Mariana Islands.
  VALUE_MP = 168,

  // Norway.
  VALUE_NO = 169,

  // Oman.
  VALUE_OM = 170,

  // Pakistan.
  VALUE_PK = 171,

  // Palau.
  VALUE_PW = 172,

  // Palestinian Territories.
  VALUE_PS = 173,

  // Panama.
  VALUE_PA = 174,

  // Papua New Guinea.
  VALUE_PG = 175,

  // Paraguay.
  VALUE_PY = 176,

  // Peru.
  VALUE_PE = 177,

  // Philippines.
  VALUE_PH = 178,

  // Pitcairn.
  VALUE_PN = 179,

  // Poland.
  VALUE_PL = 180,

  // Portugal.
  VALUE_PT = 181,

  // Puerto Rico.
  VALUE_PR = 182,

  // Qatar.
  VALUE_QA = 183,

  // Reunion.
  VALUE_RE = 184,

  // Romania.
  VALUE_RO = 185,

  // Russian Federation.
  VALUE_RU = 186,

  // Rwanda.
  VALUE_RW = 187,

  // Saint Barthelemy.
  VALUE_BL = 188,

  // Saint Helena, Ascension and Tristan da Cunha.
  VALUE_SH = 189,

  // Saint Kitts and Nevis.
  VALUE_KN = 190,

  // Saint Lucia.
  VALUE_LC = 191,

  // Saint Martin.
  VALUE_MF = 192,

  // Saint Pierre and Miquelon.
  VALUE_PM = 193,

  // Saint Vincent and the Grenadines.
  VALUE_VC = 194,

  // Samoa.
  VALUE_WS = 195,

  // San Marino.
  VALUE_SM = 196,

  // Sao Tome and Principe.
  VALUE_ST = 197,

  // Saudi Arabia.
  VALUE_SA = 198,

  // Senegal.
  VALUE_SN = 199,

  // Serbia.
  VALUE_RS = 200,

  // Seychelles.
  VALUE_SC = 201,

  // Sierra Leone.
  VALUE_SL = 202,

  // Singapore.
  VALUE_SG = 203,

  // Sint Maarten.
  VALUE_SX = 204,

  // Slovakia.
  VALUE_SK = 205,

  // Slovenia.
  VALUE_SI = 206,

  // Solomon Islands.
  VALUE_SB = 207,

  // Somalia.
  VALUE_SO = 208,

  // South Africa.
  VALUE_ZA = 209,

  // South Georgia and the South Sandwich Islands.
  VALUE_GS = 210,

  // South Sudan.
  VALUE_SS = 211,

  // Spain.
  VALUE_ES = 212,

  // Sri Lanka.
  VALUE_LK = 213,

  // Suriname.
  VALUE_SR = 214,

  // Svalbard and Jan Mayen.
  VALUE_SJ = 215,

  // Swaziland.
  VALUE_SZ = 216,

  // Sweden.
  VALUE_SE = 217,

  // Switzerland.
  VALUE_CH = 218,

  // Taiwan.
  VALUE_TW = 219,

  // Tajikistan.
  VALUE_TJ = 220,

  // Tanzania, United Republic of.
  VALUE_TZ = 221,

  // Thailand.
  VALUE_TH = 222,

  // Timor-leste.
  VALUE_TL = 223,

  // Togo.
  VALUE_TG = 224,

  // Tokelau.
  VALUE_TK = 225,

  // Tonga.
  VALUE_TO = 226,

  // Trinidad and Tobago.
  VALUE_TT = 227,

  // Tunisia.
  VALUE_TN = 228,

  // Turkey.
  VALUE_TR = 229,

  // Turkmenistan.
  VALUE_TM = 230,

  // Turks and Caicos Islands.
  VALUE_TC = 231,

  // Tuvalu.
  VALUE_TV = 232,

  // Uganda.
  VALUE_UG = 233,

  // Ukraine.
  VALUE_UA = 234,

  // United Arab Emirates.
  VALUE_AE = 235,

  // United States Minor Outlying Islands.
  VALUE_UM = 236,

  // Uruguay.
  VALUE_UY = 237,

  // Uzbekistan.
  VALUE_UZ = 238,

  // Vanuatu.
  VALUE_VU = 239,

  // Venezuela.
  VALUE_VE = 240,

  // Vietnam.
  VALUE_VN = 241,

  // Virgin Islands, British.
  VALUE_VG = 242,

  // Virgin Islands, U.S..
  VALUE_VI = 243,

  // Wallis and Futuna.
  VALUE_WF = 244,

  // Western Sahara.
  VALUE_EH = 245,

  // Yemen.
  VALUE_YE = 246,

  // Zambia.
  VALUE_ZM = 247,

  // Zimbabwe.
  VALUE_ZW = 248,

  // Iran.
  VALUE_IR = 249,

  // Syria.
  VALUE_SY = 250,

  // North Korea.
  VALUE_KP = 251,

  // China - Global App.
  VALUE_C2 = 252,
}

export const euRegionCodeList = [
  ServerRegionCode.VALUE_ALL,
  ServerRegionCode.VALUE_DE,
  ServerRegionCode.VALUE_FR,
  ServerRegionCode.VALUE_WESTERN_EUROPE,
  ServerRegionCode.VALUE_EASTERN_EUROPE,
];

export const coreCountryOverrideList = [
  ServerCountryCode.VALUE_DK,
  ServerCountryCode.VALUE_FI,
  ServerCountryCode.VALUE_IS,
  ServerCountryCode.VALUE_IE,
  ServerCountryCode.VALUE_IM,
  ServerCountryCode.VALUE_MT,
  ServerCountryCode.VALUE_NL,
  ServerCountryCode.VALUE_NO,
  ServerCountryCode.VALUE_SJ,
  ServerCountryCode.VALUE_SE,
  ServerCountryCode.VALUE_CH,
  ServerCountryCode.VALUE_GB,
];
