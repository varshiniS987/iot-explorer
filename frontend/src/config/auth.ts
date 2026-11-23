/**
 * false (default): the student site stays open, so students can learn as guests; logging in is optional and
 *                  syncs their progress to the server, where the admin portal can see it.
 * true:            every student page requires a student login.
 * The admin portal (/admin) ALWAYS requires an admin login.
 */
export const REQUIRE_STUDENT_LOGIN = false;
