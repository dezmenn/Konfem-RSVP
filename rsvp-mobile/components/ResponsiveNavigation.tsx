import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';

interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
}

interface ResponsiveNavigationProps {
  items: NavigationItem[];
  activeItem: string;
  onItemPress: (itemId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  compact?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  activeItem,
  onItemPress,
  orientation = 'horizontal',
  showLabels = true,
  compact = false
}) => {
  const [dimensions, setDimensions] = useState({ width: screenWidth, height: screenHeight });
  const [isLandscape, setIsLandscape] = useState(screenWidth > screenHeight);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    // Animate active indicator
    const activeIndex = items.findIndex(item => item.id === activeItem);
    if (activeIndex >= 0) {
      Animated.spring(slideAnim, {
        toValue: activeIndex,
        useNativeDriver: true,
      }).start();
    }
  }, [activeItem, items]);

  const getItemWidth = () => {
    if (orientation === 'vertical') return '100%';
    
    const availableWidth = dimensions.width - 32; // Account for padding
    const itemCount = items.length;
    
    if (compact || isLandscape) {
      return Math.max(60, availableWidth / itemCount);
    }
    
    return Math.max(80, availableWidth / itemCount);
  };

  const getItemHeight = () => {
    if (orientation === 'horizontal') {
      return compact ? 50 : (showLabels ? 60 : 50);
    }
    return compact ? 45 : 55;
  };

  const renderNavigationItem = (item: NavigationItem, index: number) => {
    const isActive = item.id === activeItem;
    const itemWidth = getItemWidth();
    const itemHeight = getItemHeight();

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.navItem,
          {
            width: itemWidth,
            height: itemHeight,
            opacity: item.disabled ? 0.5 : 1,
          },
          isActive && styles.activeNavItem,
          orientation === 'vertical' && styles.verticalNavItem,
        ]}
        onPress={() => !item.disabled && onItemPress(item.id)}
        activeOpacity={0.7}
        disabled={item.disabled}
      >
        <View style={styles.navItemContent}>
          <View style={styles.iconContainer}>
            <Text style={[
              styles.navIcon,
              isActive && styles.activeNavIcon,
              compact && styles.compactNavIcon
            ]}>
              {item.icon}
            </Text>
            {item.badge && item.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.badge > 99 ? '99+' : item.badge.toString()}
                </Text>
              </View>
            )}
          </View>
          
          {showLabels && !compact && (
            <Text style={[
              styles.navLabel,
              isActive && styles.activeNavLabel,
              orientation === 'vertical' && styles.verticalNavLabel
            ]} numberOfLines={1}>
              {item.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderActiveIndicator = () => {
    if (orientation === 'vertical') return null;

    const itemWidth = typeof getItemWidth() === 'number' ? getItemWidth() : 80;
    const indicatorWidth = Math.min(itemWidth * 0.6, 40);

    return (
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            width: indicatorWidth,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, items.length - 1],
                  outputRange: [
                    (itemWidth - indicatorWidth) / 2,
                    ((itemWidth * (items.length - 1)) + (itemWidth - indicatorWidth) / 2)
                  ],
                  extrapolate: 'clamp',
                })
              }
            ]
          }
        ]}
      />
    );
  };

  const containerStyle = [
    styles.container,
    orientation === 'vertical' ? styles.verticalContainer : styles.horizontalContainer,
    compact && styles.compactContainer,
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  ];

  if (orientation === 'vertical') {
    return (
      <View style={containerStyle}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.verticalScrollContent}
        >
          {items.map(renderNavigationItem)}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {renderActiveIndicator()}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.horizontalScrollContent,
          { minWidth: dimensions.width }
        ]}
      >
        {items.map(renderNavigationItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  horizontalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  verticalContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    maxHeight: '80%',
  },
  compactContainer: {
    paddingVertical: 4,
  },
  horizontalScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  verticalScrollContent: {
    flexGrow: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  verticalNavItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    marginHorizontal: 0,
    marginVertical: 2,
  },
  activeNavItem: {
    backgroundColor: '#e3f2fd',
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 24,
    color: '#666',
  },
  compactNavIcon: {
    fontSize: 20,
  },
  activeNavIcon: {
    color: '#2196F3',
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  verticalNavLabel: {
    fontSize: 14,
    marginTop: 0,
    marginLeft: 12,
    textAlign: 'left',
    flex: 1,
  },
  activeNavLabel: {
    color: '#2196F3',
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    height: 3,
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
});

export default ResponsiveNavigation;