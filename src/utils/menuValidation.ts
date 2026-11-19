export type MenuValidationInput = {
  dishName?: string;
  description?: string;
  course?: string;
  price?: string | number;
};

export type MenuValidationResult = {
  isValid: boolean;
  errors: string[];
};

export function validateMenuItem(input: MenuValidationInput): MenuValidationResult {
  const errors: string[] = [];

  const dishName = String(input.dishName ?? '').trim();
  if (!dishName) {
    errors.push('Dish name is required.');
  }

  const description = String(input.description ?? '');
  if (description.length > 240) {
    errors.push('Description must be 240 characters or fewer.');
  }

  const course = String(input.course ?? '').trim();
  if (!course) {
    errors.push('Course category is required.');
  }

  const rawPrice = input.price ?? '';
  const normalizedPrice =
    typeof rawPrice === 'number' ? rawPrice : Number(String(rawPrice).replace(/[^0-9.]/g, ''));

  if (rawPrice === '' || rawPrice === null || rawPrice === undefined || Number.isNaN(normalizedPrice) || normalizedPrice <= 0) {
    errors.push('Price is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
