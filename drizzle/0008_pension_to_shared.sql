-- The pension entitlements, the tax figures for the pension and the desired
-- pension are global values now (they were part of the pension gap profile).
-- Every global profile of a user takes the values of that user's active
-- pension gap profile, which is what applied to all of them before; the
-- pension gap profile then no longer holds them.
UPDATE `profiles`
SET `data` = json_patch(
  `data`,
  (
    SELECT json_object(
      'statePension', json_extract(`pg`.`data`, '$.statePension'),
      'companyPension', json_extract(`pg`.`data`, '$.companyPension'),
      'privatePension', json_extract(`pg`.`data`, '$.privatePension'),
      'riesterPension', json_extract(`pg`.`data`, '$.riesterPension'),
      'taxPrediction', json_extract(`pg`.`data`, '$.taxPrediction'),
      'yearlyTaxFreeAmount', json_extract(`pg`.`data`, '$.yearlyTaxFreeAmount'),
      'desiredPension', json_extract(`pg`.`data`, '$.desiredPension')
    )
    FROM `profiles` AS `pg`
    WHERE `pg`.`user_id` = `profiles`.`user_id`
      AND `pg`.`scope` = 'pension-gap'
      AND `pg`.`is_active` = 1
      AND json_valid(`pg`.`data`)
    LIMIT 1
  )
)
WHERE `scope` = 'shared'
  AND json_valid(`data`)
  AND EXISTS (
    SELECT 1 FROM `profiles` AS `pg`
    WHERE `pg`.`user_id` = `profiles`.`user_id`
      AND `pg`.`scope` = 'pension-gap'
      AND `pg`.`is_active` = 1
      AND json_valid(`pg`.`data`)
  );
--> statement-breakpoint
UPDATE `profiles`
SET `data` = json_remove(
  `data`,
  '$.statePension',
  '$.companyPension',
  '$.privatePension',
  '$.riesterPension',
  '$.taxPrediction',
  '$.yearlyTaxFreeAmount',
  '$.desiredPension'
)
WHERE `scope` = 'pension-gap' AND json_valid(`data`);
