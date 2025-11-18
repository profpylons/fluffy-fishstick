export declare function setApiKey(key: string): void;
export interface GameSearchParams {
    search?: string;
    page_size?: number;
    ordering?: string;
    dates?: string;
    platforms?: string;
    genres?: string;
}
export declare function searchGames(params: GameSearchParams): Promise<any>;
export declare function getGameDetails(id: number): Promise<any>;
export declare function getGenres(): Promise<any>;
export declare function getPlatforms(): Promise<any>;
//# sourceMappingURL=rawg.d.ts.map