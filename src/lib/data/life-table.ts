/**
 * Period life table 2023/2025 for Germany.
 *
 * Source: Federal Statistical Office of Germany (Destatis), statistical report
 * "Sterbetafeln 2023/2025", EVAS 12621, published on 7 July 2026, tables
 * 12613-b01 (male) and 12613-b02 (female).
 * https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Sterbefaelle-Lebenserwartung/Publikationen/_publikationen-innen-periodensterbetafel.html
 *
 * Generated from the Excel file of the report; for a new life table replace
 * the values and the details in LIFE_TABLE_SOURCE.
 */

export const LIFE_TABLE_SOURCE = {
  publisher: "Statistisches Bundesamt (Destatis)",
  title: "Sterbetafeln 2023/2025",
  period: "2023/2025",
  published: "2026-07-07",
  url: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Sterbefaelle-Lebenserwartung/Publikationen/_publikationen-innen-periodensterbetafel.html",
};

export type Sex = "male" | "female";

/** Highest age of the table; it stands for everyone aged 100 and older. */
export const LIFE_TABLE_MAX_AGE = 100;

/** Survivors at age x out of 100,000 live births (lx), index = age 0 to 100. */
export const SURVIVORS: Record<Sex, number[]> = {
  male: [100000, 99662, 99638, 99621, 99608, 99595, 99585, 99574, 99565, 99556, 99548, 99540, 99533, 99525, 99514, 99500, 99483, 99460, 99430, 99394, 99350, 99303, 99259, 99214, 99171, 99130, 99086, 99039, 98990, 98943, 98895, 98842, 98788, 98730, 98667, 98595, 98519, 98433, 98339, 98241, 98124, 98002, 97870, 97723, 97564, 97391, 97206, 96994, 96764, 96516, 96241, 95934, 95607, 95233, 94825, 94387, 93900, 93366, 92777, 92119, 91392, 90583, 89692, 88704, 87621, 86428, 85135, 83748, 82251, 80658, 78945, 77148, 75222, 73216, 71087, 68836, 66473, 63929, 61316, 58550, 55623, 52492, 49225, 45887, 42386, 38790, 35045, 31239, 27405, 23534, 19742, 16153, 12894, 9968, 7460, 5415, 3786, 2563, 1679, 1051, 635],
  female: [100000, 99703, 99679, 99667, 99655, 99648, 99639, 99631, 99623, 99616, 99610, 99603, 99596, 99588, 99577, 99567, 99555, 99539, 99522, 99505, 99486, 99466, 99447, 99428, 99411, 99392, 99375, 99354, 99333, 99311, 99286, 99261, 99234, 99202, 99169, 99132, 99090, 99043, 98992, 98935, 98869, 98801, 98726, 98645, 98556, 98460, 98358, 98244, 98114, 97971, 97814, 97642, 97452, 97247, 97019, 96769, 96496, 96191, 95856, 95483, 95077, 94621, 94114, 93557, 92939, 92247, 91502, 90675, 89787, 88826, 87784, 86655, 85432, 84094, 82661, 81118, 79433, 77556, 75535, 73320, 70929, 68289, 65438, 62403, 59132, 55597, 51744, 47609, 43194, 38521, 33773, 28971, 24305, 19848, 15773, 12152, 9059, 6558, 4566, 3062, 1993],
};

/** Remaining life expectancy at the highest age of the table (e100), in years. */
export const REMAINING_AT_MAX_AGE: Record<Sex, number> = {
  male: 1.764,
  female: 2.013,
};

/** Life expectancy according to the table (ex), to check our own calculation. */
export const PUBLISHED_LIFE_EXPECTANCY: Record<Sex, Record<number, number>> = {
  male: { 0: 78.82, 65: 17.97, 80: 8.20 },
  female: { 0: 83.43, 65: 21.10, 80: 9.73 },
};
