import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MD3LightTheme, PaperProvider, adaptNavigationTheme } from 'react-native-paper';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900',
    },
    labelLarge: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    labelMedium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    labelSmall: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bodyLarge: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    bodyMedium: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    bodySmall: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    headlineLarge: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    headlineMedium: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
    headlineSmall: {
      fontFamily: 'System',
      fontWeight: 'bold',
    },
  },
};

export default function Layout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : CombinedDefaultTheme;

  return (
    <PaperProvider theme={CombinedDefaultTheme}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            title: 'ManyScore',
          }}
        />
        <Stack.Screen
          name="games/new"
          options={{
            title: 'New Game',
            presentation: 'modal',
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
