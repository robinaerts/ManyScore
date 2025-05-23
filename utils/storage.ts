import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Player {
    id: string;
    name: string;
}

export interface Game {
    id: string;
    type: 'manillen';
    players: Player[];
    scores: number[];
    createdAt: string;
    updatedAt: string;
    rounds: {
        id: number;
        team1Points: string;
        team2Points: string;
        scoringTeam: number | null;
    }[];
    isEnded: boolean;
}

const STORAGE_KEYS = {
    PLAYERS: '@manyscore/players',
    GAMES: '@manyscore/games',
};

export const storage = {
    // Players
    async getPlayers(): Promise<Player[]> {
        try {
            const players = await AsyncStorage.getItem(STORAGE_KEYS.PLAYERS);
            return players ? JSON.parse(players) : [];
        } catch (error) {
            console.error('Error getting players:', error);
            return [];
        }
    },

    async savePlayer(player: Player): Promise<void> {
        try {
            const players = await this.getPlayers();
            const existingPlayer = players.find(p => p.id === player.id);
            
            if (existingPlayer) {
                const updatedPlayers = players.map(p => 
                    p.id === player.id ? player : p
                );
                await AsyncStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updatedPlayers));
            } else {
                await AsyncStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify([...players, player]));
            }
        } catch (error) {
            console.error('Error saving player:', error);
            throw new Error('Failed to save player');
        }
    },

    // Games
    async getGames(): Promise<Game[]> {
        try {
            const games = await AsyncStorage.getItem(STORAGE_KEYS.GAMES);
            return games ? JSON.parse(games) : [];
        } catch (error) {
            console.error('Error getting games:', error);
            return [];
        }
    },

    async getGame(id: string): Promise<Game | null> {
        try {
            const games = await this.getGames();
            return games.find(game => game.id === id) || null;
        } catch (error) {
            console.error('Error getting game:', error);
            return null;
        }
    },

    async saveGame(game: Game): Promise<void> {
        try {
            const games = await this.getGames();
            const existingGame = games.find(g => g.id === game.id);
            
            if (existingGame) {
                const updatedGames = games.map(g => 
                    g.id === game.id ? game : g
                );
                await AsyncStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(updatedGames));
            } else {
                await AsyncStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify([...games, game]));
            }
        } catch (error) {
            console.error('Error saving game:', error);
            throw new Error('Failed to save game');
        }
    },

    async deleteGame(id: string): Promise<void> {
        try {
            const games = await this.getGames();
            const updatedGames = games.filter(game => game.id !== id);
            await AsyncStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(updatedGames));
        } catch (error) {
            console.error('Error deleting game:', error);
            throw new Error('Failed to delete game');
        }
    },
}; 