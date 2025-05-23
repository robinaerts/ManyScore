import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Card, FAB, Text, useTheme } from 'react-native-paper';
import { Game, storage } from '../../../utils/storage';

interface Styles {
    container: ViewStyle;
    titleContainer: ViewStyle;
    section: ViewStyle;
    sectionTitleContainer: ViewStyle;
    card: ViewStyle;
    fab: ViewStyle;
}

export default function GamesScreen() {
    const theme = useTheme();
    const [games, setGames] = useState<Game[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        try {
            const savedGames = await storage.getGames();
            setGames(savedGames);
        } catch (error) {
            setError('Failed to load games');
        }
    };

    const ongoingGames = games.filter(game => !game.isEnded);
    const pastGames = games.filter(game => game.isEnded);

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.titleContainer}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Games</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionTitleContainer}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Ongoing Games</Text>
                    </View>
                    {ongoingGames.length > 0 ? (
                        ongoingGames.map(game => (
                            <Link key={game.id} href={`/games/${game.id}`} asChild>
                                <Card style={styles.card}>
                                    <Card.Content>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                                            {game.players.map((p, i) => (
                                                <Text key={p.id}>
                                                    {p.name}
                                                    {game.players.length === 2 ? (
                                                        i === 0 ? ' vs ' : ''
                                                    ) : game.players.length === 3 ? (
                                                        i === 0 ? ' vs ' : i === 1 ? ' vs ' : ''
                                                    ) : (
                                                        i === 0 ? ' & ' : i === 1 ? ' vs ' : i === 2 ? ' & ' : ''
                                                    )}
                                                </Text>
                                            ))}
                                        </Text>
                                        {game.scores.some(score => score > 0) && (
                                            <Text>
                                                Scores: {game.scores.map(score => score || 0).join(' - ')}
                                            </Text>
                                        )}
                                    </Card.Content>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text>No ongoing games</Text>
                            </Card.Content>
                        </Card>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionTitleContainer}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Past Games</Text>
                    </View>
                    {pastGames.length > 0 ? (
                        pastGames.map(game => (
                            <Link key={game.id} href={`/games/${game.id}`} asChild>
                                <Card style={styles.card}>
                                    <Card.Content>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                                            {game.players.map((p, i) => (
                                                <Text key={p.id}>
                                                    {p.name}
                                                    {game.players.length === 2 ? (
                                                        i === 0 ? ' vs ' : ''
                                                    ) : game.players.length === 3 ? (
                                                        i === 0 ? ' vs ' : i === 1 ? ' vs ' : ''
                                                    ) : (
                                                        i === 0 ? ' & ' : i === 1 ? ' vs ' : i === 2 ? ' & ' : ''
                                                    )}
                                                </Text>
                                            ))}
                                        </Text>
                                        <Text>
                                            Final Scores: {game.scores.map(score => score || 0).join(' - ')}
                                        </Text>
                                    </Card.Content>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text>No past games</Text>
                            </Card.Content>
                        </Card>
                    )}
                </View>
            </ScrollView>

            <Link href="/games/new" asChild>
                <FAB
                    icon="plus"
                    style={styles.fab}
                    color="white"
                    onPress={() => { }}
                />
            </Link>
        </View>
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
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#6200ee',
    },
});
