import { ValueTransformer } from 'typeorm';

/**
 * TypeORM returns `numeric`/`decimal` columns as strings (to preserve
 * precision). For monetary values in this application we work with JavaScript
 * numbers, so this transformer converts:
 *   - DB -> entity: string -> number
 *   - entity -> DB: number -> string (TypeORM serialises it correctly)
 *
 * NOTE: All monetary amounts are stored with 2 decimal places. The values are
 * always *calculated server-side* before persistence, so we never rely on this
 * transformer for the business arithmetic itself — only for safe round-tripping.
 */
export class DecimalTransformer implements ValueTransformer {
  to(value: number | null): number | null {
    return value;
  }

  from(value: string | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return parseFloat(value);
  }
}

export const decimalTransformer = new DecimalTransformer();
