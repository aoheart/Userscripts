/**
 * MusicBrainz URL エンティティ型定義とパーサー
 *
 * MBUrlEntry / MBRelation / MBUrlResponse の型と
 * getRelationsByType を提供する。
 */

export interface MBRelation {
  "target-type": string;
  recording?: { id: string };
  release?: { id: string };
  artist?: { id: string };
}

export interface MBUrlEntry {
  id: string;
  resource: string;
  relations: MBRelation[];
}

export interface MBUrlResponse {
  id?: string;
  resource?: string;
  relations?: MBRelation[];
  urls?: MBUrlEntry[];
  "url-count"?: number;
  "url-offset"?: number;
}

export const getRelationsByType = (entry: MBUrlEntry | null, targetType: "recording" | "release" | "artist"): MBRelation[] => {
  if (!entry) return [];
  return entry.relations.filter((r) => r["target-type"] === targetType);
};
