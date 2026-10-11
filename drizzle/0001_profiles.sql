CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`is_active` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_user_scope_name` ON `profiles` (`user_id`,`scope`,`name`);
--> statement-breakpoint
-- Every existing set of settings becomes the active profile "Standard".
INSERT INTO `profiles` (`id`, `user_id`, `scope`, `name`, `data`, `is_active`, `created_at`, `updated_at`)
SELECT lower(hex(randomblob(16))), `user_id`, `scope`, 'Standard', `data`, 1, `updated_at`, `updated_at`
FROM `settings`;
--> statement-breakpoint
-- "Rendite in der Auszahlphase" and "Auszahlung bis Alter" moved from the
-- AV-Depot calculator to the shared values. Users without shared settings
-- get a shared profile holding just these two.
INSERT INTO `profiles` (`id`, `user_id`, `scope`, `name`, `data`, `is_active`, `created_at`, `updated_at`)
SELECT lower(hex(randomblob(16))), `user_id`, 'shared', 'Standard', '{}', 1, `updated_at`, `updated_at`
FROM `settings` AS av
WHERE av.`scope` = 'av-depot'
  AND NOT EXISTS (SELECT 1 FROM `settings` AS s WHERE s.`user_id` = av.`user_id` AND s.`scope` = 'shared');
--> statement-breakpoint
UPDATE `profiles`
SET `data` = json_set(
  `data`,
  '$.retirementReturn', (SELECT json_extract(av.`data`, '$.payoutReturnRate') FROM `settings` AS av WHERE av.`user_id` = `profiles`.`user_id` AND av.`scope` = 'av-depot'),
  '$.payoutUntilAge', (SELECT json_extract(av.`data`, '$.payoutUntilAge') FROM `settings` AS av WHERE av.`user_id` = `profiles`.`user_id` AND av.`scope` = 'av-depot')
)
WHERE `scope` = 'shared'
  AND EXISTS (SELECT 1 FROM `settings` AS av WHERE av.`user_id` = `profiles`.`user_id` AND av.`scope` = 'av-depot');
