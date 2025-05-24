import { router } from 'expo-router';
import { nanoid } from 'nanoid/non-secure';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { Button, Dialog, Divider, HelperText, Menu, Portal, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { Player, storage } from '../../utils/storage';

interface Styles {
    container: ViewStyle;
    titleContainer: ViewStyle;
    section: ViewStyle;
    sectionTitleContainer: ViewStyle;
    input: TextStyle;
    button: ViewStyle;
    playerInput: ViewStyle;
    menuButton: ViewStyle;
    dialogInput: TextStyle;
    teamBadge: ViewStyle;
}

export default function NewGameScreen() {
    const theme = useTheme();
    const [gameType, setGameType] = useState('manillen');
    const [playerCount, setPlayerCount] = useState('2');
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [menuVisible, setMenuVisible] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [newPlayerDialogVisible, setNewPlayerDialogVisible] = useState(false);

    useEffect(() => {
        loadPlayers();
    }, []);

    const loadPlayers = async () => {
        try {
            const savedPlayers = await storage.getPlayers();
            setPlayers(savedPlayers);
        } catch (error) {
            setError('Failed to load players');
        }
    };

    const handlePlayerCountChange = (value: string) => {
        setPlayerCount(value);
        const count = parseInt(value);
        setSelectedPlayers(prev => prev.slice(0, count));
    };

    const handleCreatePlayer = async () => {
        if (!newPlayerName.trim()) {
            setError('Player name cannot be empty');
            return;
        }

        try {
            const newPlayer: Player = {
                id: nanoid(),
                name: newPlayerName.trim(),
            };
            await storage.savePlayer(newPlayer);
            setPlayers(prev => [...prev, newPlayer]);
            setNewPlayerName('');
            setError('');
            setNewPlayerDialogVisible(false);
        } catch (error) {
            setError('Failed to create player');
        }
    };

    const handleSelectPlayer = (index: number, player: Player) => {
        if (selectedPlayers.some((p, i) => i !== index && p.id === player.id)) {
            setError('This player is already selected');
            return;
        }

        const newSelectedPlayers = [...selectedPlayers];
        newSelectedPlayers[index] = player;
        setSelectedPlayers(newSelectedPlayers);
        setMenuVisible(null);
        setError('');
    };

    const handleCreateGame = async () => {
        if (selectedPlayers.length !== parseInt(playerCount)) {
            setError('Please select all players');
            return;
        }

        try {
            const game = {
                id: nanoid(),
                type: 'manillen' as const,
                players: selectedPlayers,
                scores: Array(selectedPlayers.length).fill(0),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                rounds: [],
                isEnded: false
            };

            await storage.saveGame(game);
            router.replace(`/games/${game.id}`);
        } catch (error) {
            setError('Failed to create game');
        }
    };

    const getTeamNumber = (index: number) => {
        const count = parseInt(playerCount);
        if (count === 2) {
            return index === 0 ? 1 : 2;
        } else if (count === 3) {
            return 0; // No teams for 3 players
        } else if (count === 4) {
            return index % 2 === 0 ? 1 : 2;
        }
        return 0;
    };

    const getTeamColor = (index: number) => {
        const teamNumber = getTeamNumber(index);
        if (teamNumber === 0) return theme.colors.surfaceVariant;
        return teamNumber === 1 ? theme.colors.primary : theme.colors.secondary;
    };

    const getTeamLabel = (index: number) => {
        const teamNumber = getTeamNumber(index);
        if (teamNumber === 0) return 'Solo';
        return `Team ${teamNumber}`;
    };

    return (
        <ScrollView style={styles.container}>

            <View style={styles.section}>
                <View style={styles.sectionTitleContainer}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Game Type</Text>
                </View>
                <SegmentedButtons
                    value={gameType}
                    onValueChange={setGameType}
                    buttons={[
                        { value: 'manillen', label: 'Manillen' },
                        { value: 'other', label: 'Other' },
                    ]}
                />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionTitleContainer}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Number of Players</Text>
                </View>
                <SegmentedButtons
                    value={playerCount}
                    onValueChange={handlePlayerCountChange}
                    buttons={[
                        { value: '2', label: '2' },
                        { value: '3', label: '3' },
                        { value: '4', label: '4' },
                    ]}
                />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionTitleContainer}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Players</Text>
                </View>
                {Array.from({ length: parseInt(playerCount) }).map((_, index) => (
                    <View key={index} style={styles.playerInput}>
                        <Menu
                            visible={menuVisible === index}
                            onDismiss={() => setMenuVisible(null)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setMenuVisible(index)}
                                    style={styles.menuButton}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ flex: 1 }}>
                                            {selectedPlayers[index]?.name || `Select Player ${index + 1}`}
                                        </Text>
                                        <View style={[
                                            styles.teamBadge,
                                            { backgroundColor: getTeamColor(index) }
                                        ]}>
                                            <Text style={{ color: 'white', fontSize: 12 }}>
                                                {getTeamLabel(index)}
                                            </Text>
                                        </View>
                                    </View>
                                </Button>
                            }
                        >
                            {players.map(player => (
                                <Menu.Item
                                    key={player.id}
                                    onPress={() => handleSelectPlayer(index, player)}
                                    title={player.name}
                                    disabled={selectedPlayers.some((p, i) => i !== index && p.id === player.id)}
                                />
                            ))}
                            <Divider />
                            <Menu.Item
                                onPress={() => {
                                    setMenuVisible(null);
                                    setNewPlayerDialogVisible(true);
                                }}
                                title="Add New Player"
                            />
                        </Menu>
                    </View>
                ))}
            </View>

            {error ? (
                <HelperText type="error" visible={!!error}>
                    {error}
                </HelperText>
            ) : null}

            <Button
                mode="contained"
                onPress={handleCreateGame}
                style={styles.button}
                disabled={selectedPlayers.length !== parseInt(playerCount)}
            >
                Start Game
            </Button>

            <Portal>
                <Dialog visible={newPlayerDialogVisible} onDismiss={() => setNewPlayerDialogVisible(false)}>
                    <Dialog.Title>Add New Player</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Player Name"
                            value={newPlayerName}
                            onChangeText={setNewPlayerName}
                            style={styles.dialogInput}
                            autoFocus
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setNewPlayerDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleCreatePlayer}>Add</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
    input: {
        marginBottom: 8,
    },
    button: {
        marginTop: 16,
        marginBottom: 32,
    },
    playerInput: {
        marginBottom: 8,
    },
    menuButton: {
        width: '100%',
    },
    dialogInput: {
        marginTop: 8,
    },
    teamBadge: {
        padding: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
}); 