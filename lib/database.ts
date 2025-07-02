// lib/database.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export interface Celebrity {
  id: number;
  name: string;
  image_url: string | null;
  created_at: string;
  is_celebrity: boolean; // Add this field
}

export interface CelebrityAlias {
  id: number;
  celebrity_id: number;
  alias: string;
  created_at: string;
}

export interface Interaction {
  id: number;
  celebrity_id: number;
  celebrity_name: string;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  field: string | null;
  interaction_date: string;
  created_at: string;
  is_celebrity: boolean;
}

export interface TopCelebrity {
  celebrity_id: number;
  celebrity_name: string;
  celebrity_aliases: string | null;
  image_url: string | null;
  is_celebrity: boolean;
  total_positive: number;
  total_negative: number;
  total_neutral: number;
  total_interactions: number;
  main_aspects: string[];
  total_reactions: number;
}

export interface TopReactionCelebrity {
  celebrity_id: number;
  celebrity_name: string;
  total_reactions: number;
  created_at: string;
}

export async function getCelebrities(): Promise<Celebrity[]> {
  const result = await sql`
    SELECT * FROM celebrities
    ORDER BY name
  `;
  return result as Celebrity[];
}

export async function getCelebrityAliases(
  celebrityId: number
): Promise<CelebrityAlias[]> {
  const result = await sql`
    SELECT * FROM celebrity_aliases
    WHERE celebrity_id = ${celebrityId}
    ORDER BY alias
  `;
  return result as CelebrityAlias[];
}

export async function getTopCelebrities(
  startDate: string,
  endDate: string,
  topic?: string,
  sentimentFilter?: "positive" | "negative" | "all"
): Promise<TopCelebrity[]> {
  try {
    let result: any[];

    // Base SELECT statement with alias aggregation and is_celebrity
    const baseSelect = sql`
      c.id as celebrity_id,
      c.name as celebrity_name,
      c.image_url,
      c.is_celebrity,
      aliases.celebrity_aliases,
      COALESCE(inter.total_positive, 0) as total_positive,
      COALESCE(inter.total_negative, 0) as total_negative,
      COALESCE(inter.total_neutral, 0) as total_neutral,
      COALESCE(inter.total_interactions, 0) as total_interactions,
      inter.main_aspects,
      COALESCE(react.total_reactions, 0) as total_reactions
    `;

    // Base JOIN and WHERE clause
    const baseJoinWhere = (topicCondition: any) => sql`
      FROM celebrities c
      LEFT JOIN (
        SELECT
          i.celebrity_id,
          SUM(i.positive_count) as total_positive,
          SUM(i.negative_count) as total_negative,
          SUM(i.neutral_count) as total_neutral,
          SUM(i.positive_count + i.negative_count + i.neutral_count) as total_interactions,
          ARRAY_AGG(DISTINCT i.field) FILTER (WHERE i.field IS NOT NULL AND i.field != 'null') as main_aspects
        FROM interactions i
        WHERE i.interaction_date BETWEEN ${startDate} AND ${endDate}
        ${topicCondition ? sql`AND (${topicCondition})` : sql``}
        GROUP BY i.celebrity_id
      ) inter ON c.id = inter.celebrity_id
      LEFT JOIN (
        SELECT
          ca.celebrity_id,
          STRING_AGG(ca.alias, ', ') as celebrity_aliases
        FROM celebrity_aliases ca
        GROUP BY ca.celebrity_id
      ) aliases ON c.id = aliases.celebrity_id
      LEFT JOIN (
        SELECT
          r.celebrity_id,
          SUM(r.total_reactions) as total_reactions
        FROM reactions r
        WHERE r.created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY r.celebrity_id
      ) react ON c.id = react.celebrity_id
      WHERE c.is_celebrity = TRUE
      AND COALESCE(inter.total_interactions, 0) > 0
    `;

    const topicCondition =
      topic && topic !== "all" ? sql`i.field = ${topic}` : null;

    if (sentimentFilter === "positive") {
      result = await sql`SELECT ${baseSelect} ${baseJoinWhere(
        topicCondition
      )} ORDER BY total_positive DESC`;
    } else if (sentimentFilter === "negative") {
      result = await sql`SELECT ${baseSelect} ${baseJoinWhere(
        topicCondition
      )} ORDER BY total_negative DESC`;
    } else {
      result = await sql`SELECT ${baseSelect} ${baseJoinWhere(
        topicCondition
      )} ORDER BY total_interactions DESC`;
    }

    // Process the result to combine aspects
    return result.map((row) => ({
      ...row,
      main_aspects: (row.main_aspects || []).filter(
        (aspect: string) => aspect !== null && aspect !== "null"
      ),
    })) as TopCelebrity[];
  } catch (error) {
    console.error("Database error in getTopCelebrities:", error);
    return [];
  }
}

export async function getInteractions(
  startDate: string,
  endDate: string,
  topic?: string
): Promise<Interaction[]> {
  try {
    let result: any[];

    // Ensure we join with celebrities table to filter by is_celebrity
    const baseQuery = (topicCondition: any) => sql`
      SELECT
        i.*,
        c.name as celebrity_name,
        c.is_celebrity -- Include is_celebrity from celebrities table
      FROM interactions i
      JOIN celebrities c ON i.celebrity_id = c.id
      WHERE i.interaction_date BETWEEN ${startDate} AND ${endDate}
        AND c.is_celebrity = TRUE -- Filter interactions by is_celebrity
        ${topicCondition ? sql`AND (${topicCondition})` : sql``}
      ORDER BY i.interaction_date DESC, i.created_at DESC
    `;

    const topicCondition =
      topic && topic !== "all" ? sql`i.field = ${topic}` : null;

    result = await sql`${baseQuery(topicCondition)}`;

    return result as Interaction[];
  } catch (error) {
    console.error("Database error in getInteractions:", error);
    return [];
  }
}

export async function addCelebrity(
  name: string,
  imageUrl?: string,
  isCelebrity: boolean = false // Add isCelebrity with a default value
): Promise<Celebrity> {
  const result = await sql`
    INSERT INTO celebrities (name, image_url, is_celebrity)
    VALUES (${name}, ${imageUrl || null}, ${isCelebrity})
    RETURNING *
  `;
  return result[0] as Celebrity;
}

export async function updateCelebrity(
  id: number,
  name: string,
  imageUrl?: string,
  isCelebrity?: boolean // Add isCelebrity, optional for general update
): Promise<Celebrity> {
  const result = await sql`
    UPDATE celebrities
    SET 
      name = ${name}, 
      image_url = ${imageUrl || null},
      is_celebrity = COALESCE(${isCelebrity}, is_celebrity) -- Update if provided, else keep current
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Celebrity;
}

// New function to update only the is_celebrity status
export async function updateCelebrityIsCelebrity(
  id: number,
  isCelebrity: boolean
): Promise<Celebrity> {
  const result = await sql`
    UPDATE celebrities
    SET is_celebrity = ${isCelebrity}
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Celebrity;
}

export async function addCelebrityAlias(
  celebrityId: number,
  alias: string
): Promise<CelebrityAlias> {
  const result = await sql`
    INSERT INTO celebrity_aliases (celebrity_id, alias)
    VALUES (${celebrityId}, ${alias})
    RETURNING *
  `;
  return result[0] as CelebrityAlias;
}

export async function deleteCelebrityAlias(id: number): Promise<void> {
  await sql`DELETE FROM celebrity_aliases WHERE id = ${id}`;
}

export async function getTopReactionCelebrities(
  startDate: string,
  endDate: string,
  topic?: string,
  sentimentFilter?: "positive" | "negative" | "all"
): Promise<TopReactionCelebrity[]> {
  try {
    // Lấy danh sách celebrity_id thỏa mãn filter giống getTopCelebrities
    const topicCondition =
      topic && topic !== "all" ? sql`i.field = ${topic}` : null;

    let sentimentOrder: any;
    if (sentimentFilter === "positive") {
      sentimentOrder = sql`ORDER BY SUM(i.positive_count) DESC`;
    } else if (sentimentFilter === "negative") {
      sentimentOrder = sql`ORDER BY SUM(i.negative_count) DESC`;
    } else {
      sentimentOrder = sql`ORDER BY SUM(i.positive_count + i.negative_count + i.neutral_count) DESC`;
    }

    const celebrityIdsResult = await sql`
      SELECT i.celebrity_id
      FROM interactions i
      JOIN celebrities c ON i.celebrity_id = c.id
      WHERE i.interaction_date BETWEEN ${startDate} AND ${endDate}
        AND c.is_celebrity = TRUE
        ${topicCondition ? sql`AND (${topicCondition})` : sql``}
      GROUP BY i.celebrity_id
      HAVING SUM(i.positive_count + i.negative_count + i.neutral_count) > 0
      ${sentimentOrder}
      LIMIT 100
    `;
    const celebrityIds = celebrityIdsResult.map((row: any) => row.celebrity_id);
    if (celebrityIds.length === 0) return [];

    // Lấy top reactions chỉ với celebrity_id đã lọc
    const result = await sql`
      SELECT
        c.id as celebrity_id,
        c.name as celebrity_name,
        c.image_url,
        COALESCE(SUM(r.total_reactions), 0) as total_reactions
      FROM celebrities c
      LEFT JOIN reactions r ON c.id = r.celebrity_id
        AND r.created_at BETWEEN ${startDate} AND ${endDate}
      WHERE c.is_celebrity = TRUE
        AND c.id = ANY(${celebrityIds})
      GROUP BY c.id, c.name, c.image_url
      HAVING COALESCE(SUM(r.total_reactions), 0) > 0
      ORDER BY total_reactions DESC
      LIMIT 10
    `;
    return result as TopReactionCelebrity[];
  } catch (error) {
    console.error("Database error in getTopReactionCelebrities:", error);
    return [];
  }
}
