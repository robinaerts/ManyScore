import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { Button, Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { Game, storage } from '../../utils/storage';

interface Round {
    id: number;
    team1Points: string;
    team2Points: string;
    scoringTeam: number | null;
}

interface Styles {
    container: ViewStyle;
    titleContainer: ViewStyle;
    section: ViewStyle;
    sectionTitleContainer: ViewStyle;
    sectionTitle: TextStyle;
    card: ViewStyle;
    pointsContainer: ViewStyle;
    teamPoints: ViewStyle;
    teamTitleContainer: ViewStyle;
    teamTitle: TextStyle;
    teamScore: TextStyle;
    roundContainer: ViewStyle;
    roundHeader: ViewStyle;
    roundNumber: TextStyle;
    roundContent: ViewStyle;
    roundText: TextStyle;
    buttonContainer: ViewStyle;
    button: ViewStyle;
    teamButton: ViewStyle;
    teamButtonSelected: ViewStyle;
    input: ViewStyle;
    turnIndicator: TextStyle;
    scoreRow: ViewStyle;
    playerInfo: ViewStyle;
    playerName: TextStyle;
    score: TextStyle;
    pointsInput: TextStyle;
    teamInputContainer: ViewStyle;
    teamLabel: TextStyle;
    playerNameContainer: ViewStyle;
    teamPlayersContainer: ViewStyle;
    teamPlayerRow: ViewStyle;
    teamAnd: TextStyle;
}

export default function GameScreen() {
    const theme = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [game, setGame] = useState<Game | null>(null);
    const [error, setError] = useState('');
    const [rounds, setRounds] = useState<Round[]>([{ id: 1, team1Points: '', team2Points: '', scoringTeam: null }]);
    const [currentRound, setCurrentRound] = useState(1);
    const [points, setPoints] = useState('');
    const [scoringTeam, setScoringTeam] = useState<number | null>(null);

    useEffect(() => {
        loadGame();
    }, [id]);

    const loadGame = async () => {
        try {
            const loadedGame = await storage.getGame(id);
            if (loadedGame) {
                setGame(loadedGame);
                if (loadedGame.rounds?.length) {
                    setRounds(loadedGame.rounds);
                    setCurrentRound(loadedGame.rounds.length);
                }
            }
        } catch (error) {
            setError('Failed to load game');
        }
    };

    const calculateScores = (rounds: Round[]) => {
        if (!game) return [0, 0];

        if (game.players.length === 2) {
            // For 2 players, just track their individual scores
            return rounds.reduce((acc, round) => {
                if (round.scoringTeam === 1) {
                    acc[0] += parseInt(round.team1Points) || 0;
                } else if (round.scoringTeam === 2) {
                    acc[1] += parseInt(round.team2Points) || 0;
                }
                return acc;
            }, [0, 0]);
        } else if (game.players.length === 3) {
            // For 3 players, track individual scores with rotating solo player
            return rounds.reduce((acc, round) => {
                const roundNumber = round.id;
                const soloPlayerIndex = (roundNumber - 1) % 3;

                if (round.scoringTeam === 1) {
                    // Solo player scored
                    acc[soloPlayerIndex] += parseInt(round.team1Points) || 0;
                } else if (round.scoringTeam === 2) {
                    // Other two players scored
                    const otherPlayer1 = (soloPlayerIndex + 1) % 3;
                    const otherPlayer2 = (soloPlayerIndex + 2) % 3;
                    acc[otherPlayer1] += parseInt(round.team2Points) || 0;
                    acc[otherPlayer2] += parseInt(round.team2Points) || 0;
                }
                return acc;
            }, [0, 0, 0]);
        } else {
            // For 4 players, track team scores (1&3 vs 2&4)
            return rounds.reduce((acc, round) => {
                if (round.scoringTeam === 1) {
                    acc[0] += parseInt(round.team1Points) || 0;
                    acc[1] += parseInt(round.team2Points) || 0;
                } else if (round.scoringTeam === 2) {
                    acc[2] += parseInt(round.team1Points) || 0;
                    acc[3] += parseInt(round.team2Points) || 0;
                }
                return acc;
            }, [0, 0, 0, 0]);
        }
    };

    const addRound = async () => {
        if (!game) return;

        try {
            const newRounds = [...rounds, { id: rounds.length + 1, team1Points: '', team2Points: '', scoringTeam: null }];
            setRounds(newRounds);
            setCurrentRound(rounds.length + 1);

            // Calculate current scores
            const currentScores = calculateScores(newRounds.slice(0, -1));

            // Update game with current scores and rounds
            const updatedGame = {
                ...game,
                scores: currentScores,
                rounds: newRounds.slice(0, -1), // Save all rounds except the new empty one
                updatedAt: new Date().toISOString(),
            };

            await storage.saveGame(updatedGame);
            setGame(updatedGame);
        } catch (error) {
            setError('Failed to save round');
        }
    };

    const updatePoints = async (roundId: number, team: 'team1Points' | 'team2Points', points: string) => {
        if (!game) return;

        try {
            const newRounds = rounds.map(round =>
                round.id === roundId ? {
                    ...round,
                    [team]: points,
                    scoringTeam: team === 'team1Points' ? 1 : 2,
                    [team === 'team1Points' ? 'team2Points' : 'team1Points']: '' // Clear other team's points
                } : round
            );
            setRounds(newRounds);

            // Calculate current scores
            const currentScores = calculateScores(newRounds);

            // Update game with current scores and rounds
            const updatedGame = {
                ...game,
                scores: currentScores,
                rounds: newRounds,
                updatedAt: new Date().toISOString(),
            };

            await storage.saveGame(updatedGame);
            setGame(updatedGame);
        } catch (error) {
            setError('Failed to update points');
        }
    };

    const updateScoringTeam = async (roundId: number, teamNumber: number) => {
        if (!game) return;

        try {
            const newRounds = rounds.map(round =>
                round.id === roundId ? {
                    ...round,
                    scoringTeam: teamNumber,
                    team1Points: '',
                    team2Points: ''
                } : round
            );
            setRounds(newRounds);

            // Update game with current rounds
            const updatedGame = {
                ...game,
                rounds: newRounds,
                updatedAt: new Date().toISOString(),
            };

            await storage.saveGame(updatedGame);
            setGame(updatedGame);
        } catch (error) {
            setError('Failed to update scoring team');
        }
    };

    const handleEndGame = async () => {
        if (!game) return;

        try {
            // Calculate final scores
            const finalScores = calculateScores(rounds);

            const updatedGame = {
                ...game,
                scores: finalScores,
                rounds: rounds,
                updatedAt: new Date().toISOString(),
                isEnded: true,
            };

            await storage.saveGame(updatedGame);
            router.replace('/games');
        } catch (error) {
            setError('Failed to end game');
        }
    };

    const handleDeleteGame = async () => {
        if (!game) return;

        try {
            await storage.deleteGame(game.id);
            router.replace('/games');
        } catch (error) {
            setError('Failed to delete game');
        }
    };

    const getCurrentPlayer = () => {
        if (!game) return null;

        if (game.players.length === 2) {
            return currentRound % 2 === 1 ? game.players[0] : game.players[1];
        } else if (game.players.length === 3) {
            const playerIndex = (currentRound - 1) % 3;
            return game.players[playerIndex];
        } else {
            // For 4 players, first and third player are team 1, second and fourth are team 2
            const playerIndex = (currentRound - 1) % 4;
            return game.players[playerIndex];
        }
    };

    const isPlayerTurn = (playerIndex: number) => {
        if (!game) return false;
        const currentPlayer = getCurrentPlayer();
        return currentPlayer?.id === game.players[playerIndex].id;
    };

    const getThreePlayerTeams = (roundNumber: number) => {
        if (!game) return { team1: [], team2: [] };

        const soloPlayerIndex = (roundNumber - 1) % 3;
        const team1 = [game.players[soloPlayerIndex]];
        const team2 = [
            game.players[(soloPlayerIndex + 1) % 3],
            game.players[(soloPlayerIndex + 2) % 3]
        ];
        return { team1, team2 };
    };

    if (!game) {
        return (
            <View style={styles.container}>
                <Text>Loading game...</Text>
            </View>
        );
    }

    const isThreePlayerGame = game.players.length === 3;
    const team1Score = game.players.length === 4 ? (game.scores[0] + game.scores[2]) : game.scores[0];
    const team2Score = game.players.length === 4 ? (game.scores[1] + game.scores[3]) : game.scores[1];

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Current Game',
                    headerRight: () => game.isEnded ? (
                        <IconButton
                            icon="delete"
                            iconColor={theme.colors.error}
                            size={24}
                            onPress={handleDeleteGame}
                        />
                    ) : null
                }}
            />
            <ScrollView style={styles.container}>

                <View style={styles.section}>
                    <View style={styles.sectionTitleContainer}>
                        <Text style={styles.sectionTitle}>
                            {game.isEnded ? 'Final Score' : ''}
                        </Text>
                    </View>
                    <Card style={styles.card}>
                        <Card.Content>
                            {game.players.length === 3 ? (
                                <>
                                    <View style={[styles.pointsContainer, { marginVertical: 16 }]}>
                                        {game.players.map((player, index) => (
                                            <View key={player.id} style={styles.scoreRow}>
                                                <View style={styles.playerInfo}>
                                                    <Text style={styles.playerName}>
                                                        {player.name}
                                                        {!game.isEnded && isPlayerTurn(index) && (
                                                            <Text style={styles.turnIndicator}> TURN</Text>
                                                        )}
                                                    </Text>
                                                    <Text style={[styles.score, { color: theme.colors.primary }]}>{game.scores[index]}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                    {!game.isEnded && (
                                        <View style={styles.teamTitleContainer}>
                                            <Text style={styles.teamTitle}>Current Round Teams</Text>
                                            {(() => {
                                                const { team1, team2 } = getThreePlayerTeams(currentRound);
                                                return (
                                                    <>
                                                        <View style={styles.teamInputContainer}>
                                                            <Text style={styles.teamLabel}>{team1[0].name} (Solo)</Text>
                                                            <TextInput
                                                                label="Points"
                                                                value={rounds[currentRound - 1].team1Points}
                                                                onChangeText={(text) => updatePoints(currentRound, 'team1Points', text)}
                                                                keyboardType="numeric"
                                                                style={styles.pointsInput}
                                                                mode="outlined"
                                                                onSubmitEditing={() => {
                                                                    if (rounds[currentRound - 1].team1Points || rounds[currentRound - 1].team2Points) {
                                                                        addRound();
                                                                    }
                                                                }}
                                                            />
                                                        </View>
                                                        <View style={styles.teamInputContainer}>
                                                            <Text style={styles.teamLabel}>{team2[0].name} & {team2[1].name}</Text>
                                                            <TextInput
                                                                label="Points"
                                                                value={rounds[currentRound - 1].team2Points}
                                                                onChangeText={(text) => updatePoints(currentRound, 'team2Points', text)}
                                                                keyboardType="numeric"
                                                                style={styles.pointsInput}
                                                                mode="outlined"
                                                                onSubmitEditing={() => {
                                                                    if (rounds[currentRound - 1].team1Points || rounds[currentRound - 1].team2Points) {
                                                                        addRound();
                                                                    }
                                                                }}
                                                            />
                                                        </View>
                                                    </>
                                                );
                                            })()}
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={styles.pointsContainer}>
                                    <View style={styles.teamPoints}>
                                        <View style={styles.teamTitleContainer}>
                                            <View style={styles.playerNameContainer}>
                                                <Text style={styles.teamTitle}>
                                                    {game.players.length === 2 ? (
                                                        <>
                                                            {game.players[0].name}
                                                            {!game.isEnded && isPlayerTurn(0) && (
                                                                <Text style={styles.turnIndicator}> TURN</Text>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Text style={styles.teamTitle}>
                                                                {game.players[0].name}
                                                                {!game.isEnded && isPlayerTurn(0) && (
                                                                    <Text style={styles.turnIndicator}> TURN</Text>
                                                                )}
                                                            </Text>
                                                            <Text style={styles.teamAnd}> & </Text>
                                                            <Text style={styles.teamTitle}>
                                                                {game.players[2].name}
                                                                {!game.isEnded && isPlayerTurn(2) && (
                                                                    <Text style={styles.turnIndicator}> TURN</Text>
                                                                )}
                                                            </Text>
                                                        </>
                                                    )}
                                                </Text>
                                            </View>
                                            <Text style={[styles.teamScore, { color: theme.colors.primary }]}>
                                                {team1Score}
                                            </Text>
                                        </View>
                                        {!game.isEnded && (
                                            <TextInput
                                                label="Points"
                                                value={rounds[currentRound - 1].team1Points}
                                                onChangeText={(text) => updatePoints(currentRound, 'team1Points', text)}
                                                keyboardType="numeric"
                                                style={styles.pointsInput}
                                                mode="outlined"
                                                onSubmitEditing={() => {
                                                    if (rounds[currentRound - 1].team1Points || rounds[currentRound - 1].team2Points) {
                                                        addRound();
                                                    }
                                                }}
                                            />
                                        )}
                                    </View>
                                    <View style={styles.teamPoints}>
                                        <View style={styles.teamTitleContainer}>
                                            <View style={styles.playerNameContainer}>
                                                <Text style={styles.teamTitle}>
                                                    {game.players.length === 2 ? (
                                                        <>
                                                            {game.players[1].name}
                                                            {!game.isEnded && isPlayerTurn(1) && (
                                                                <Text style={styles.turnIndicator}> TURN</Text>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Text style={styles.teamTitle}>
                                                                {game.players[1].name}
                                                                {!game.isEnded && isPlayerTurn(1) && (
                                                                    <Text style={styles.turnIndicator}> TURN</Text>
                                                                )}
                                                            </Text>
                                                            <Text style={styles.teamAnd}> & </Text>
                                                            <Text style={styles.teamTitle}>
                                                                {game.players[3].name}
                                                                {!game.isEnded && isPlayerTurn(3) && (
                                                                    <Text style={styles.turnIndicator}> TURN</Text>
                                                                )}
                                                            </Text>
                                                        </>
                                                    )}
                                                </Text>
                                            </View>
                                            <Text style={[styles.teamScore, { color: theme.colors.primary }]}>
                                                {team2Score}
                                            </Text>
                                        </View>
                                        {!game.isEnded && (
                                            <TextInput
                                                label="Points"
                                                value={rounds[currentRound - 1].team2Points}
                                                onChangeText={(text) => updatePoints(currentRound, 'team2Points', text)}
                                                keyboardType="numeric"
                                                style={styles.pointsInput}
                                                mode="outlined"
                                                onSubmitEditing={() => {
                                                    if (rounds[currentRound - 1].team1Points || rounds[currentRound - 1].team2Points) {
                                                        addRound();
                                                    }
                                                }}
                                            />
                                        )}
                                    </View>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                </View>

                {!game.isEnded && (
                    <View style={styles.buttonContainer}>
                        <Button
                            mode="contained"
                            onPress={addRound}
                            style={styles.button}
                            disabled={!rounds[currentRound - 1].team1Points && !rounds[currentRound - 1].team2Points}
                        >
                            Add Score
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={handleEndGame}
                            style={styles.button}
                        >
                            End Game
                        </Button>
                    </View>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionTitleContainer}>
                        <Text style={styles.sectionTitle}>Round History</Text>
                    </View>
                    {rounds.slice(0, -1).map((round, index) => (
                        <Card key={index} style={styles.card}>
                            <Card.Content>
                                <View style={styles.roundContainer}>
                                    <View style={styles.roundHeader}>
                                        <Text style={styles.roundNumber}>
                                            Round {index + 1}
                                        </Text>
                                    </View>
                                    <View style={styles.roundContent}>
                                        <Text style={styles.roundText}>
                                            {game.players.length === 2 ? (
                                                round.scoringTeam === 1 ? (
                                                    game.players[0].name
                                                ) : (
                                                    game.players[1].name
                                                )
                                            ) : game.players.length === 3 ? (
                                                (() => {
                                                    const { team1, team2 } = getThreePlayerTeams(index + 1);
                                                    return round.scoringTeam === 1 ? (
                                                        `${team1[0].name}`
                                                    ) : (
                                                        `${team2[0].name} & ${team2[1].name}`
                                                    );
                                                })()
                                            ) : (
                                                round.scoringTeam === 1 ? (
                                                    `${game.players[0].name} & ${game.players[2].name}`
                                                ) : (
                                                    `${game.players[1].name} & ${game.players[3].name}`
                                                )
                                            )} scored {round.scoringTeam === 1 ? round.team1Points : round.team2Points} points
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create<Styles>({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitleContainer: {
        marginBottom: 12,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    card: {
        marginBottom: 12,
        borderRadius: 12,
    },
    pointsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
    },
    teamPoints: {
        flex: 1,
        marginHorizontal: 8,
        alignItems: 'center',
    },
    teamTitleContainer: {
        marginBottom: 12,
        alignItems: 'center',
        width: '100%',
        minHeight: 80,
    },
    playerNameContainer: {
        minHeight: 24,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    teamPlayersContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 24,
    },
    teamAnd: {
        marginHorizontal: 8,
        color: '#333',
        fontWeight: 'bold',
    },
    teamTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    teamScore: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'center',
    },
    roundContainer: {
        flexDirection: 'column',
    },
    roundHeader: {
        marginBottom: 8,
    },
    roundNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    roundContent: {
        marginLeft: 8,
    },
    roundText: {
        fontSize: 14,
        color: '#666',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 32,
    },
    button: {
        flex: 1,
        marginHorizontal: 8,
        borderRadius: 8,
    },
    teamButton: {
        marginBottom: 8,
    },
    teamButtonSelected: {
        backgroundColor: '#6200ee',
    },
    input: {
        marginTop: 8,
    },
    turnIndicator: {
        color: '#6200ee',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    scoreRow: {
        flex: 1,
        minWidth: '33%',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    playerInfo: {
        alignItems: 'center',
    },
    playerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 4,
    },
    score: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    pointsInput: {
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: 'white',
        height: 50,
    },
    teamInputContainer: {
        marginBottom: 16,
        width: '100%',
    },
    teamLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        textAlign: 'center',
    },
}); 