import { createContext, useContext } from 'react';
import type { ColorMode } from '../theme';

interface ColorModeContextType {
  mode: ColorMode;
  toggle: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggle: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);
