import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Card, Text, useTheme } from 'react-native-paper';
import { Game, Player, storage } from '../../utils/storage';

interface Styles {
    container: ViewStyle;
    titleContainer: ViewStyle;
    section: ViewStyle;
    sectionTitleContainer: ViewStyle;
    card: ViewStyle;
    chartContainer: ViewStyle;
}

export default function StatsScreen() {
    const theme = useTheme();
    const [games, setGames] = useState<Game[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [error, setError] = useState('');

    const loadGames = async () => {
        try {
            const savedGames = await storage.getGames();
            setGames(savedGames);
        } catch (error) {
            setError('Failed to load games');
        }
    };

    // Load games when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadGames();
        }, [])
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [savedGames, savedPlayers] = await Promise.all([
                storage.getGames(),
                storage.getPlayers()
            ]);
            setGames(savedGames);
            setPlayers(savedPlayers);
        } catch (error) {
            setError('Failed to load data');
        }
    };

    const getPlayerStats = (playerId: string) => {
        const playerGames = games.filter(game =>
            game.players.some(p => p.id === playerId)
        );

        const wins = playerGames.filter(game => {
            if (game.players.length === 2) {
                const playerIndex = game.players.findIndex(p => p.id === playerId);
                return game.scores[playerIndex] > game.scores[1 - playerIndex];
            } else if (game.players.length === 3) {
                const playerIndex = game.players.findIndex(p => p.id === playerId);
                return game.scores[playerIndex] > Math.max(...game.scores.filter((_, i) => i !== playerIndex));
            } else {
                const playerIndex = game.players.findIndex(p => p.id === playerId);
                const team1Score = game.scores[0] + game.scores[2];
                const team2Score = game.scores[1] + game.scores[3];
                return (playerIndex % 2 === 0 && team1Score > team2Score) ||
                    (playerIndex % 2 === 1 && team2Score > team1Score);
            }
        }).length;

        return {
            gamesPlayed: playerGames.length,
            wins,
            winRate: playerGames.length > 0 ? (wins / playerGames.length) * 100 : 0
        };
    };

    const getPlayerScores = (playerId: string) => {
        return games
            .filter(game => game.players.some(p => p.id === playerId))
            .map(game => {
                const playerIndex = game.players.findIndex(p => p.id === playerId);
                if (game.players.length === 4) {
                    // For 4 players, return the team score
                    const team1Score = game.scores[0] + game.scores[2];
                    const team2Score = game.scores[1] + game.scores[3];
                    return playerIndex % 2 === 0 ? team1Score : team2Score;
                }
                return game.scores[playerIndex] || 0;
            });
    };

    const chartConfig = {
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
    };

    const screenWidth = Dimensions.get('window').width - 32;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.titleContainer}>
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Statistics</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionTitleContainer}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Player Performance</Text>
                </View>
                {players.map(player => {
                    const stats = getPlayerStats(player.id);
                    const scores = getPlayerScores(player.id);

                    return (
                        <Card key={player.id} style={styles.card}>
                            <Card.Content>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                                    {player.name}
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <Text>Games: {stats.gamesPlayed}</Text>
                                    <Text>Wins: {stats.wins}</Text>
                                    <Text>Win Rate: {stats.winRate.toFixed(1)}%</Text>
                                </View>
                                {scores.length > 0 && (
                                    <View style={styles.chartContainer}>
                                        <LineChart
                                            data={{
                                                labels: Array.from({ length: scores.length }, (_, i) => (i + 1).toString()),
                                                datasets: [{
                                                    data: scores
                                                }]
                                            }}
                                            width={screenWidth}
                                            height={180}
                                            chartConfig={chartConfig}
                                            bezier
                                            style={{
                                                marginVertical: 8,
                                                borderRadius: 16
                                            }}
                                        />
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    );
                })}
            </View>

            <View style={styles.section}>
                <View style={styles.sectionTitleContainer}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Game Distribution</Text>
                </View>
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.chartContainer}>
                            <BarChart
                                data={{
                                    labels: ['2 Players', '3 Players', '4 Players'],
                                    datasets: [{
                                        data: [
                                            games.filter(g => g.players.length === 2).length,
                                            games.filter(g => g.players.length === 3).length,
                                            games.filter(g => g.players.length === 4).length
                                        ]
                                    }]
                                }}
                                width={screenWidth}
                                height={220}
                                chartConfig={chartConfig}
                                yAxisLabel=""
                                yAxisSuffix=""
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </View>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create<Styles>({
    container: {
        flex: 1,
        padding: 16,
    },
    titleContainer: {
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitleContainer: {
        marginBottom: 8,
    },
    card: {
        marginBottom: 8,
    },
    chartContainer: {
        alignItems: 'center',
    },
}); 