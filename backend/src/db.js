export async function query(db, text, params=[]) {
  const res = await db.query(text, params);
  return res.rows;
}
