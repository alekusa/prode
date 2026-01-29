export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    updated_at: string | null
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    points: number
                    role: 'user' | 'admin'
                    website: string | null
                }
                Insert: {
                    id: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    points?: number
                    role?: 'user' | 'admin'
                    website?: string | null
                }
                Update: {
                    id?: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    points?: number
                    role?: 'user' | 'admin'
                    website?: string | null
                }
            }
            teams: {
                Row: {
                    id: string
                    name: string
                    short_name: string
                    badge_url: string | null
                    primary_color: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    short_name: string
                    badge_url?: string | null
                    primary_color?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    short_name?: string
                    badge_url?: string | null
                    primary_color?: string | null
                    created_at?: string
                }
            }
            matches: {
                Row: {
                    id: string
                    home_team_id: string
                    away_team_id: string
                    start_time: string
                    status: 'scheduled' | 'live' | 'finished' | 'postponed'
                    home_score: number | null
                    away_score: number | null
                    round: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    home_team_id: string
                    away_team_id: string
                    start_time: string
                    status?: 'scheduled' | 'live' | 'finished' | 'postponed'
                    home_score?: number | null
                    away_score?: number | null
                    round: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    home_team_id?: string
                    away_team_id?: string
                    start_time?: string
                    status?: 'scheduled' | 'live' | 'finished' | 'postponed'
                    home_score?: number | null
                    away_score?: number | null
                    round?: number
                    created_at?: string
                }
            }
            predictions: {
                Row: {
                    id: string
                    user_id: string
                    match_id: string
                    home_score: number
                    away_score: number
                    points_awarded: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    match_id: string
                    home_score: number
                    away_score: number
                    points_awarded?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    match_id?: string
                    home_score?: number
                    away_score?: number
                    points_awarded?: number | null
                    created_at?: string
                }
            }
        }
    }
}
