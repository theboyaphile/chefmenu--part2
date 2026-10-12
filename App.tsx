import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { validateMenuItem } from './src/utils/menuValidation';

type TabKey = 'menu' | 'orders' | 'inventory' | 'settings' | 'add';
type FilterKey = 'all' | 'starter' | 'main' | 'dessert';
type CourseCategory =
  | 'Starter (First Course)'
  | 'Main Course (Entrée)'
  | 'Dessert (Final Course)';
type KitchenStation = 'Sauté' | 'Grill & Roast' | 'Pastry' | 'Garde Manger';
type DietaryTag = 'Gluten-Free (GF)' | 'Vegan' | 'Nut-Free' | 'Dairy-Free';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  course: CourseCategory;
  price: number;
  kitchenStations: KitchenStation[];
  dietaryTags: DietaryTag[];
  posVisible: boolean;
};

type OrderLine = {
  id: string;
  item: MenuItem;
  quantity: number;
};

type DraftState = {
  dishName: string;
  description: string;
  course: string;
  price: string;
  kitchenStations: KitchenStation[];
  dietaryTags: DietaryTag[];
  posVisible: boolean;
};

const PALETTE = {
  background: '#f8f9ff',
  panel: '#fffdfc',
  field: '#f4f6fb',
  border: '#e6e9f2',
  terracotta: '#9a4023',
  terracottaSoft: '#d98b60',
  sage: '#436652',
  dark: '#2c3138',
  warning: '#b64141',
  success: '#2d6b50',
  white: '#ffffff',
  textMuted: '#6f7480',
  pale: '#edf1f8',
};

const COURSE_OPTIONS: CourseCategory[] = [
  'Starter (First Course)',
  'Main Course (Entrée)',
  'Dessert (Final Course)',
];

const KITCHEN_OPTIONS: KitchenStation[] = ['Sauté', 'Grill & Roast', 'Pastry', 'Garde Manger'];
const DIETARY_OPTIONS: DietaryTag[] = ['Gluten-Free (GF)', 'Vegan', 'Nut-Free', 'Dairy-Free'];

const formatRand = (value: number) => `R${value.toFixed(2)}`;

const seedMenuItems: MenuItem[] = [
  {
    id: 'seed-1',
    name: 'Pan-Seared Duck Breast',
    description: 'Honey lavender glaze, charred parsnip purée, pickled blackberries, and rich jus de canard reduction.',
    course: 'Main Course (Entrée)',
    price: 34,
    kitchenStations: ['Grill & Roast'],
    dietaryTags: ['Gluten-Free (GF)'],
    posVisible: true,
  },
  {
    id: 'seed-2',
    name: 'Heirloom Burrata & Figs',
    description: 'Aged balsamic reduction, toasted pistachio crumble, wild baby arugula, and artisanal grilled sourdough crisps.',
    course: 'Starter (First Course)',
    price: 18.5,
    kitchenStations: ['Sauté'],
    dietaryTags: ['Vegan', 'Nut-Free'],
    posVisible: true,
  },
  {
    id: 'seed-3',
    name: 'Wild Morel Risotto',
    description: 'Acquerello carnaroli rice, black truffle emulsion, 24-month Parmigiano-Reggiano, and fresh tender chervil.',
    course: 'Main Course (Entrée)',
    price: 29,
    kitchenStations: ['Sauté'],
    dietaryTags: ['Dairy-Free'],
    posVisible: true,
  },
  {
    id: 'seed-4',
    name: 'Valrhona Chocolate Tart',
    description: 'Smoked sea salt caramel, quenelle of Tahitian vanilla bean gelato, and candied roasted cocoa nibs.',
    course: 'Dessert (Final Course)',
    price: 15,
    kitchenStations: ['Pastry'],
    dietaryTags: ['Nut-Free'],
    posVisible: true,
  },
];

const baseDraft: DraftState = {
  dishName: '',
  description: '',
  course: '',
  price: '',
  kitchenStations: ['Sauté'],
  dietaryTags: [],
  posVisible: true,
};

const navItems = [
  { key: 'menu', label: 'Menu' },
  { key: 'orders', label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'settings', label: 'Settings' },
] as const;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('menu');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(seedMenuItems);
  const [orderItems, setOrderItems] = useState<OrderLine[]>([]);
  const [draft, setDraft] = useState<DraftState>(baseDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const filteredMenuItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const categoryMatch =
        filter === 'all'
          ? true
          : filter === 'starter'
            ? item.course.includes('Starter')
            : filter === 'main'
              ? item.course.includes('Main Course')
              : item.course.includes('Dessert');

      const searchMatch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.course.toLowerCase().includes(normalizedSearch);

      return categoryMatch && searchMatch;
    });
  }, [filter, menuItems, searchQuery]);

  const orderTotal = useMemo(
    () => orderItems.reduce((sum, line) => sum + line.item.price * line.quantity, 0),
    [orderItems],
  );

  const draftPreviewPrice = useMemo(() => {
    const parsed = Number(draft.price);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [draft.price]);

  const updateDraft = (partial: Partial<DraftState>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const handleAddToOrder = (item: MenuItem) => {
    setOrderItems((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }
      return [...current, { id: item.id, item, quantity: 1 }];
    });
    setActiveTab('orders');
  };

  const updateOrderQuantity = (orderId: string, delta: number) => {
    setOrderItems((current) =>
      current
        .map((entry) =>
          entry.id === orderId ? { ...entry, quantity: Math.max(0, entry.quantity + delta) } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  };

  const toggleSelection = <T extends string>(field: 'kitchenStations' | 'dietaryTags', value: T) => {
    setDraft((current) => {
      const existing = current[field] as T[];
      const next = existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value];
      return { ...current, [field]: next };
    });
  };

  const handleSubmit = () => {
    const validation = validateMenuItem({
      dishName: draft.dishName,
      description: draft.description,
      course: draft.course,
      price: draft.price,
    });

    const nextErrors: Record<string, string> = {};
    if (validation.errors.includes('Dish name is required.')) nextErrors.dishName = 'Dish name is required.';
    if (validation.errors.includes('Course category is required.')) nextErrors.course = 'Course category is required.';
    if (validation.errors.includes('Price is required.')) nextErrors.price = 'Price is required.';
    if (validation.errors.includes('Description must be 240 characters or fewer.')) nextErrors.description = 'Description must be 240 characters or fewer.';

    setErrors(nextErrors);
    if (!validation.isValid) return;

    setIsSaving(true);
    setSaveBanner(null);

    setTimeout(() => {
      const nextItem: MenuItem = {
        id: `dish-${Date.now()}`,
        name: draft.dishName.trim(),
        description: draft.description.trim(),
        course: draft.course as CourseCategory,
        price: Number(draft.price),
        kitchenStations: draft.kitchenStations,
        dietaryTags: draft.dietaryTags,
        posVisible: draft.posVisible,
      };

      setMenuItems((current) => [nextItem, ...current]);
      setDraft(baseDraft);
      setErrors({});
      setIsSaving(false);
      setSaveBanner('Saved to Service!');
      setActiveTab('menu');

      setTimeout(() => setSaveBanner(null), 2200);
    }, 800);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <Pressable style={styles.menuCard} key={item.id}>
      <LinearGradient colors={['#f9f0e8', '#efe4dc']} style={styles.menuThumb}>
        <Text style={styles.thumbText}>{item.name.slice(0, 2).toUpperCase()}</Text>
      </LinearGradient>

      <View style={styles.cardCopyWrap}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.metaWrap}>
            <View style={styles.coursePill}>
              <Text style={styles.coursePillText}>
                {item.course.includes('Starter') ? 'Starter' : item.course.includes('Dessert') ? 'Dessert' : 'Main Course'}
              </Text>
            </View>
            <Text style={styles.menuTitle}>{item.name}</Text>
          </View>
          <Text style={styles.menuPrice}>{formatRand(item.price)}</Text>
        </View>

        <Text style={styles.menuDescription}>{item.description}</Text>

        <View style={styles.tagRow}>
          {item.kitchenStations.slice(0, 2).map((station) => (
            <Text key={`${item.id}-${station}`} style={styles.tagChip}>{station}</Text>
          ))}
          {item.dietaryTags.slice(0, 2).map((tag) => (
            <Text key={`${item.id}-${tag}`} style={[styles.tagChip, styles.tagChipMuted]}>{tag}</Text>
          ))}
        </View>

        <View style={styles.cardActionRow}>
          <Text style={styles.menuCountText}>{orderItems.find((entry) => entry.id === item.id)?.quantity ?? 0} in order</Text>
          <Pressable style={styles.orderButton} onPress={() => handleAddToOrder(item)}>
            <Text style={styles.orderButtonText}>Add to order</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const renderOrdersScreen = () => (
    <View style={styles.orderScreen}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.sectionLabel}>Customer Order</Text>
          <Text style={styles.sectionTitle}>Current Order</Text>
        </View>
        <View style={styles.serviceBadge}>
          <Text style={styles.serviceBadgeText}>{orderItems.reduce((sum, entry) => sum + entry.quantity, 0)} Items</Text>
        </View>
      </View>

      {orderItems.length === 0 ? (
        <View style={styles.emptyOrderState}>
          <Text style={styles.emptyTitle}>No dishes added yet</Text>
          <Text style={styles.emptyCopy}>Choose a dish from the menu and it will appear here with the total.</Text>
        </View>
      ) : (
        <View style={styles.orderListWrap}>
          {orderItems.map((entry) => (
            <View key={entry.id} style={styles.orderRow}>
              <View style={styles.orderInfoWrap}>
                <Text style={styles.orderName}>{entry.item.name}</Text>
                <Text style={styles.orderMeta}>{formatRand(entry.item.price)} each</Text>
              </View>

              <View style={styles.orderControls}>
                <Pressable style={styles.qtyButton} onPress={() => updateOrderQuantity(entry.id, -1)}>
                  <Text style={styles.qtyButtonText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{entry.quantity}</Text>
                <Pressable style={styles.qtyButton} onPress={() => updateOrderQuantity(entry.id, 1)}>
                  <Text style={styles.qtyButtonText}>＋</Text>
                </Pressable>
              </View>

              <Text style={styles.orderSubtotal}>{formatRand(entry.item.price * entry.quantity)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.orderSummaryCard}>
        <Text style={styles.summaryLabel}>Order total</Text>
        <Text style={styles.summaryTotal}>{formatRand(orderTotal)}</Text>
      </View>
    </View>
  );

  const renderMenuScreen = () => (
    <View style={styles.menuScreen}>
      {saveBanner ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{saveBanner}</Text>
        </View>
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.sectionLabel}>Mise En Place</Text>
          <Text style={styles.sectionTitle}>Chef's Menu</Text>
        </View>
        <View style={styles.serviceBadge}>
          <View style={styles.serviceDot} />
          <Text style={styles.serviceBadgeText}>{menuItems.length} Active Dishes</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search dishes, ingredients..."
          placeholderTextColor="#8d9aa9"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowInner}>
        {(['all', 'starter', 'main', 'dessert'] as FilterKey[]).map((option) => {
          const optionLabel = option === 'all' ? 'All' : option === 'starter' ? 'Starters' : option === 'main' ? 'Main Courses' : 'Desserts';
          const isActive = filter === option;
          return (
            <Pressable
              key={option}
              onPress={() => setFilter(option)}
              style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
            >
              <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : styles.filterChipTextInactive]}>{optionLabel}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.bannerNote}>
        <Text style={styles.bannerNoteText}>Evening Service tasting menu active • Prep complete</Text>
      </View>

      <FlatList
        data={filteredMenuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          menuItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No menu items have been added yet</Text>
              <Text style={styles.emptyCopy}>Start a new dish draft to add it to the active service menu.</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No dishes match your filter</Text>
              <Text style={styles.emptyCopy}>Try adjusting your search query or reset the category filter.</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

    </View>
  );

  const renderAddScreen = () => (
    <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.formHeaderRow}>
        <Pressable onPress={() => setActiveTab('menu')}>
          <Text style={styles.backLink}>Back to Menu</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('menu')}>
          <Text style={styles.closeIcon}>×</Text>
        </Pressable>
      </View>
      <Text style={styles.addTitle}>Add New Menu Item</Text>
      <Text style={styles.addSubtitle}>Create or update dishes for the active seasonal dinner menu</Text>

      <View style={styles.heroCard}>
        <LinearGradient colors={['#ede3d8', '#dfe9e2']} style={styles.heroThumb}>
          <Text style={styles.heroThumbText}>{draft.dishName ? draft.dishName.slice(0, 2).toUpperCase() : 'LB'}</Text>
        </LinearGradient>
        <View style={styles.heroMeta}>
          <Text style={styles.heroLabel}>Draft Dish Preview</Text>
          <Text style={styles.heroName}>{draft.dishName || 'Untitled Dish'}</Text>
        </View>
        <Text style={styles.heroPrice}>{formatRand(draftPreviewPrice)}</Text>
      </View>

      {Object.keys(errors).length > 0 ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>Please complete the required dish details.</Text>
        </View>
      ) : null}

      <View style={styles.formCard}>
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Dish Name <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            value={draft.dishName}
            onChangeText={(value) => updateDraft({ dishName: value })}
            style={[styles.input, errors.dishName ? styles.inputError : null]}
            placeholder="e.g., Pan-Seared Atlantic Cod"
            placeholderTextColor="#9aa1ae"
            autoCapitalize="words"
            autoCorrect={false}
          />
          {errors.dishName ? <Text style={styles.errorText}>{errors.dishName}</Text> : null}
        </View>

        <View style={styles.fieldWrap}>
          <View style={styles.counterRow}>
            <Text style={styles.fieldLabel}>Description</Text>
            <Text style={styles.counterText}>{draft.description.length} / 240</Text>
          </View>
          <TextInput
            value={draft.description}
            onChangeText={(value) => updateDraft({ description: value.slice(0, 240) })}
            style={[styles.textArea, errors.description ? styles.inputError : null]}
            placeholder="Enter brief dish summary, key ingredients, allergens, or preparation notes..."
            placeholderTextColor="#9aa1ae"
            multiline
            maxLength={240}
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Course Category <Text style={styles.requiredMark}>*</Text></Text>
          <Pressable style={[styles.selectBox, errors.course ? styles.inputError : null]} onPress={() => setShowCoursePicker(true)}>
            <Text style={[styles.selectText, draft.course ? styles.selectTextSelected : null]}>{draft.course || 'Select course'}</Text>
            <Text style={styles.caret}>▾</Text>
          </Pressable>
          {errors.course ? <Text style={styles.errorText}>{errors.course}</Text> : null}
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Menu Price <Text style={styles.requiredMark}>*</Text></Text>
          <View style={[styles.priceField, errors.price ? styles.inputError : null]}>
            <Text style={styles.currencySymbol}>R</Text>
            <TextInput
              value={draft.price}
              onChangeText={(value) => updateDraft({ price: value })}
              style={styles.priceInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9aa1ae"
            />
            <Text style={styles.currencyBadge}>ZAR</Text>
          </View>
          {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Kitchen Station Assignment</Text>
        <View style={styles.pillGrid}>
          {KITCHEN_OPTIONS.map((station) => {
            const isActive = draft.kitchenStations.includes(station);
            return (
              <Pressable
                key={station}
                onPress={() => toggleSelection('kitchenStations', station)}
                style={[styles.pill, isActive ? styles.pillSelected : styles.pillDefault]}
              >
                <Text style={[styles.pillText, isActive ? styles.pillTextSelected : null]}>{station}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Dietary & Guest Flags</Text>
          <View style={styles.pillGrid}>
            {DIETARY_OPTIONS.map((tag) => {
              const isActive = draft.dietaryTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleSelection('dietaryTags', tag)}
                  style={[styles.pill, isActive ? styles.pillSelectedAlt : styles.pillDefault]}
                >
                  <Text style={[styles.pillText, isActive ? styles.pillTextSelectedAlt : styles.pillTextMuted]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Text style={styles.switchTitle}>Immediate Service Availability</Text>
            <Text style={styles.switchSubtitle}>Visible to waitstaff POS instantly</Text>
          </View>
          <Switch
            value={draft.posVisible}
            onValueChange={(value) => updateDraft({ posVisible: value })}
            trackColor={{ false: '#d9dfe9', true: '#436652' }}
            thumbColor={draft.posVisible ? '#ffffff' : '#ffffff'}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Save Menu Item</Text>}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.appShell}>
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <View style={styles.logoMark}><Text style={styles.logoText}>L</Text></View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandName}>L'Atelier Bistro</Text>
            <Text style={styles.brandSubhead}>Kitchen Portal</Text>
          </View>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Service</Text>
        </View>
      </View>

      {activeTab === 'menu' ? renderMenuScreen() : activeTab === 'orders' ? renderOrdersScreen() : (
        <View style={styles.placeholderScreen}>
          <Text style={styles.placeholderTitle}>{activeTab === 'inventory' ? 'Inventory' : 'Settings'}</Text>
          <Text style={styles.placeholderCopy}>This service module is ready for the next phase of the operation dashboard.</Text>
        </View>
      )}

      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                if (item.key === 'menu') setActiveTab('menu');
                else setActiveTab(item.key);
              }}
              style={[styles.navItem, isActive ? styles.navItemActive : null]}
            >
              <Text style={[styles.navLabel, isActive ? styles.navLabelActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={showCoursePicker} transparent animationType="fade" onRequestClose={() => setShowCoursePicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCoursePicker(false)}>
          <View style={styles.modalSheet}>
            {COURSE_OPTIONS.map((course) => (
              <Pressable
                key={course}
                style={styles.optionRow}
                onPress={() => {
                  updateDraft({ course });
                  setShowCoursePicker(false);
                }}
              >
                <Text style={styles.optionText}>{course}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: '#f8f9ff',
  },
  brandWrap: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PALETTE.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  brandTextWrap: {
    flexShrink: 1,
  },
  brandName: {
    color: '#171c23',
    fontSize: 18,
    fontWeight: '700',
  },
  brandSubhead: {
    color: '#9a4023',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#edf1ea',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#436652',
    marginRight: 6,
  },
  statusText: {
    color: '#436652',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  menuScreen: {
    flex: 1,
    paddingBottom: 100,
    paddingHorizontal: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9a4023',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addActionIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
    lineHeight: 18,
  },
  addActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleWrap: {
    flex: 1,
  },
  sectionLabel: {
    color: '#9a4023',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#171c23',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 3,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaeef8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  serviceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#436652',
    marginRight: 6,
  },
  serviceBadgeText: {
    color: '#171c23',
    fontSize: 11,
    fontWeight: '700',
  },
  searchWrap: {
    marginTop: 10,
    marginBottom: 14,
  },
  searchInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#edf1f9',
    paddingHorizontal: 16,
    color: '#171c23',
    fontSize: 15,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterRowInner: {
    paddingRight: 10,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#9a4023',
  },
  filterChipInactive: {
    backgroundColor: '#e9edf6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipTextInactive: {
    color: '#4d5763',
  },
  bannerNote: {
    backgroundColor: '#dfece4',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bannerNoteText: {
    color: '#2d4f3d',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eef2f8',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  menuThumb: {
    width: 76,
    height: 76,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  thumbText: {
    color: '#9a4023',
    fontSize: 22,
    fontWeight: '700',
  },
  cardCopyWrap: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaWrap: {
    flex: 1,
    marginRight: 8,
  },
  coursePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#f9e5d8',
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
  },
  coursePillText: {
    color: '#9a4023',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  menuTitle: {
    color: '#171c23',
    fontSize: 18,
    fontWeight: '700',
  },
  menuPrice: {
    color: '#9a4023',
    fontSize: 18,
    fontWeight: '700',
  },
  menuDescription: {
    color: '#5d6775',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tagChip: {
    backgroundColor: '#f0ece8',
    color: '#5a514d',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: '700',
    marginRight: 6,
    marginBottom: 6,
  },
  tagChipMuted: {
    backgroundColor: '#e8f0ec',
    color: '#436652',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  menuCountText: {
    color: '#6f7480',
    fontSize: 11,
    fontWeight: '600',
  },
  orderButton: {
    backgroundColor: '#9a4023',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  orderButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  orderScreen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 110,
    paddingTop: 10,
  },
  orderListWrap: {
    marginTop: 18,
  },
  orderRow: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#edf2f8',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderInfoWrap: {
    flex: 1,
  },
  orderName: {
    color: '#171c23',
    fontSize: 15,
    fontWeight: '700',
  },
  orderMeta: {
    color: '#6f7480',
    fontSize: 11,
    marginTop: 4,
  },
  orderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#edf1f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: '#171c23',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
    color: '#171c23',
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  orderSubtotal: {
    color: '#9a4023',
    fontSize: 15,
    fontWeight: '700',
  },
  orderSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#edf2f8',
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#6f7480',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryTotal: {
    color: '#9a4023',
    fontSize: 24,
    fontWeight: '800',
  },
  emptyOrderState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 90,
    paddingHorizontal: 26,
  },
  emptyTitle: {
    color: '#171c23',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCopy: {
    color: '#6f7480',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  fabWrap: {
    position: 'absolute',
    right: 24,
    bottom: 80,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9a4023',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },
  fabButtonText: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '400',
    marginTop: -4,
  },
  successBanner: {
    backgroundColor: '#eaf6ef',
    borderColor: '#b5d6c1',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#2d6b50',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  formScroll: {
    paddingHorizontal: 18,
    paddingBottom: 110,
    paddingTop: 10,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backLink: {
    color: '#5b6170',
    fontSize: 12,
    fontWeight: '600',
  },
  closeIcon: {
    color: '#171c23',
    fontSize: 30,
    fontWeight: '300',
  },
  addTitle: {
    color: '#171c23',
    fontSize: 29,
    fontWeight: '700',
    marginBottom: 4,
  },
  addSubtitle: {
    color: '#5d6775',
    fontSize: 12,
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#edf2f8',
    marginBottom: 18,
  },
  heroThumb: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroThumbText: {
    color: '#9a4023',
    fontSize: 21,
    fontWeight: '700',
  },
  heroMeta: {
    flex: 1,
  },
  heroLabel: {
    color: '#9a4023',
    fontSize: 10,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  heroName: {
    color: '#171c23',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  heroPrice: {
    color: '#9a4023',
    fontSize: 18,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#edf2f8',
  },
  fieldWrap: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: '#171c23',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  requiredMark: {
    color: '#9a4023',
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#f5f7fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9edf5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#171c23',
  },
  inputError: {
    borderColor: '#db7d7d',
    backgroundColor: '#fff7f7',
  },
  errorText: {
    color: '#b64141',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    color: '#6f7480',
    fontSize: 11,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#f5f7fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9edf5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#171c23',
  },
  selectBox: {
    backgroundColor: '#f5f7fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9edf5',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: '#9aa1ae',
    fontSize: 15,
  },
  selectTextSelected: {
    color: '#171c23',
  },
  caret: {
    color: '#171c23',
    fontSize: 20,
  },
  priceField: {
    backgroundColor: '#f5f7fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9edf5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: '#171c23',
    fontSize: 22,
    fontWeight: '700',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    color: '#171c23',
    paddingVertical: 0,
  },
  currencyBadge: {
    backgroundColor: '#e9edf7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#436652',
    fontSize: 10,
    fontWeight: '700',
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  pillDefault: {
    backgroundColor: '#f5f7fb',
    borderColor: '#e9edf5',
  },
  pillSelected: {
    backgroundColor: '#9a4023',
    borderColor: '#9a4023',
  },
  pillSelectedAlt: {
    backgroundColor: '#dfece4',
    borderColor: '#dfece4',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextMuted: {
    color: '#4d5763',
  },
  pillTextSelected: {
    color: '#ffffff',
  },
  pillTextSelectedAlt: {
    color: '#2d4f3d',
  },
  switchRow: {
    backgroundColor: '#f7f8fb',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  switchLeft: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    color: '#171c23',
    fontSize: 13,
    fontWeight: '700',
  },
  switchSubtitle: {
    color: '#6f7480',
    fontSize: 11,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#9a4023',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  warningBanner: {
    backgroundColor: '#fff2f2',
    borderColor: '#f1c4c4',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  warningText: {
    color: '#a44949',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#edf2f8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  navItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#9a4023',
  },
  navLabel: {
    color: '#75808c',
    fontSize: 11,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,17,17,0.28)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  optionRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f6',
  },
  optionText: {
    color: '#171c23',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderTitle: {
    color: '#171c23',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  placeholderCopy: {
    color: '#6f7480',
    fontSize: 14,
    textAlign: 'center',
  },
});
