-- The duration of the Sparrechner follows the retirement age by default now.
-- Profiles that still hold the former defaults (20.000 € end value, 7 years)
-- would aim at an end value they exceed anyway; they get the new defaults.
-- Profiles whose duration was set free on purpose stay as they are.
UPDATE `profiles`
SET `data` = json_set(`data`, '$.durationYears', 30)
WHERE `scope` = 'savings'
  AND CASE
    WHEN json_valid(`data`) THEN
      json_extract(`data`, '$.endValue') = 20000
      AND json_extract(`data`, '$.durationYears') = 7
      AND json_extract(`data`, '$.untilRetirement') IS NOT 0
    ELSE 0
  END;
--> statement-breakpoint
UPDATE `profiles`
SET `data` = json_set(`data`, '$.endValue', 250000)
WHERE `scope` = 'savings'
  AND CASE
    WHEN json_valid(`data`) THEN
      json_extract(`data`, '$.endValue') = 20000
      AND json_extract(`data`, '$.untilRetirement') IS NOT 0
    ELSE 0
  END;
