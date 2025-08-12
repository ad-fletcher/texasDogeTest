# Improving Data Search with Fuzzy Search

This document outlines a plan to implement fuzzy searching capabilities in your `texasDOGE` database, specifically on the `agencyCodes` table. This will allow for more flexible and user-friendly searches, accommodating misspellings and variations in search terms. For example, a search for "Texas A&M" could return results like "Texas A&M University" or "TAMU".

We will use the `pg_trgm` PostgreSQL extension, which provides functions and operators for determining the similarity of alphanumeric text based on trigram matching.

## Step-by-Step Implementation Plan

### 1. Enable the `pg_trgm` Extension

First, you need to enable the `pg_trgm` extension in your Supabase project. You can do this by running the following SQL command in the Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

This command only needs to be run once per database.

### 2. Create a GIN Index

To significantly speed up fuzzy searches on the `Agency_Name` column, you should create a GIN (Generalized Inverted Index) index. This index is ideal for indexing text data for fuzzy string searching.

Run the following SQL command to create the index:

```sql
CREATE INDEX agency_name_trgm_idx ON "public"."agencyCodes" USING gin ("Agency_Name" gin_trgm_ops);
```

This will create an index named `agency_name_trgm_idx` on the `Agency_Name` column of the `agencyCodes` table.

### 3. Perform a Fuzzy Search

With the extension enabled and the index created, you can now perform fuzzy searches using the similarity operator (`%`). This operator returns `true` if its arguments have a similarity that is greater than the current similarity threshold set by `pg_trgm.similarity_threshold`. The default threshold is 0.3.

Here is an example of how to perform a fuzzy search for "Texas A&M":

```sql
SELECT
  "Agency_Name",
  similarity("Agency_Name", 'Texas A&M') AS score
FROM
  "public"."agencyCodes"
WHERE
  "Agency_Name" % 'Texas A&M'
ORDER BY
  score DESC;
```

### Explanation of the Query

*   `SELECT "Agency_Name", similarity("Agency_Name", 'Texas A&M') AS score`: This selects the agency name and calculates a similarity score between the `Agency_Name` and the search term 'Texas A&M'.
*   `FROM "public"."agencyCodes"`: This specifies the table to search.
*   `WHERE "Agency_Name" % 'Texas A&M'`: This is the fuzzy search condition. It filters for rows where the `Agency_Name` is similar to 'Texas A&M'.
*   `ORDER BY score DESC`: This orders the results by the similarity score in descending order, so the most relevant results appear first.

### 4. Adjusting the Similarity Threshold (Optional)

If the default similarity threshold of 0.3 is not suitable for your needs, you can adjust it for your current session. For example, to set a higher (stricter) threshold:

```sql
SET pg_trgm.similarity_threshold = 0.5;
```

You can then run your search query again to see the effect of the new threshold. Finding the right threshold may require some experimentation based on your data and user feedback.
