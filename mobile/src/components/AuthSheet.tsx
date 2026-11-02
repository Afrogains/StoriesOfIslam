import { Eye, EyeOff, LogIn, ShieldCheck, UserPlus, WifiOff, X } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native';
import { useAuth, type AuthMode } from '../auth/AuthProvider';
import { passwordProblem } from '../auth/validation';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { BODY_FONT_FAMILY, alpha, brandGradients, radius } from '../theme/tokens';
import { Body, BodyStrong, Caption, GradientButton, Overline, Small, Title, useTheme } from './ui';

type AuthTab = 'signin' | 'register';

type OpenOptions = { tab?: AuthTab; reason?: string; onSuccess?: (mode: AuthMode) => void };

type AuthSheetContextValue = { openAuth: (options?: OpenOptions) => void };

const AuthSheetContext = createContext<AuthSheetContextValue | null>(null);

function Field({
  label,
  value,
  onChangeText,
  secure,
  autoComplete,
  keyboardType,
  placeholder,
  onSubmitEditing,
  onFocus,
  inputRef,
  hint,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  autoComplete?: 'name' | 'email' | 'password' | 'new-password';
  keyboardType?: 'email-address' | 'default';
  placeholder?: string;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  hint?: string | null;
  testID?: string;
}) {
  const { colors, isDark } = useTheme();
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.field}>
      <Caption color={colors.inkMuted} style={styles.fieldLabel}>
        {label}
      </Caption>
      <View
        style={[
          styles.inputWrap,
          { borderColor: colors.border, backgroundColor: isDark ? colors.cardAlt : colors.card },
        ]}
      >
        <TextInput
          ref={inputRef}
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && hidden}
          autoCapitalize={autoComplete === 'name' ? 'words' : 'none'}
          autoCorrect={false}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSubtle}
          returnKeyType={onSubmitEditing ? 'go' : 'next'}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          accessibilityLabel={label}
          style={[styles.input, { color: colors.ink, fontFamily: BODY_FONT_FAMILY }]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((on) => !on)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={10}
          >
            {hidden ? <Eye size={18} color={colors.inkMuted} /> : <EyeOff size={18} color={colors.inkMuted} />}
          </Pressable>
        ) : null}
      </View>
      {hint ? <Caption color={colors.inkSubtle}>{hint}</Caption> : null}
    </View>
  );
}

function AuthForm({
  options,
  onClose,
  onFieldFocus,
}: {
  options: OpenOptions;
  onClose: () => void;
  onFieldFocus: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { register, signIn } = useAuth();
  const [tab, setTab] = useState<AuthTab>(options.tab ?? 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<AuthMode | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result =
        tab === 'register' ? await register({ name, email, password }) : await signIn({ email, password });
      setPassword('');
      Keyboard.dismiss();
      if (result.mode === 'device') {
        setDone('device');
      } else {
        options.onSuccess?.(result.mode);
        onClose();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done === 'device') {
    return (
      <View style={styles.doneBox}>
        <View style={[styles.doneIcon, { backgroundColor: alpha(colors.gold, 0.14) }]}>
          <WifiOff size={22} color={colors.gold} />
        </View>
        <Title style={styles.center}>You’re signed in on this device</Title>
        <Body style={styles.center}>
          The Stories of Islam server couldn’t be reached, so your account is saved securely on this phone. Quiz
          results and game scores are kept here. Sign in again when you’re online to move the account to the
          server.
        </Body>
        <GradientButton
          label="Continue"
          size="lg"
          gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
          onPress={() => {
            options.onSuccess?.('device');
            onClose();
          }}
        />
      </View>
    );
  }

  const registering = tab === 'register';
  const passwordHint = registering && password ? passwordProblem(password) : null;

  return (
    <>
      <View style={[styles.tabs, { backgroundColor: colors.subtleBg }]}>
        {(['signin', 'register'] as const).map((value) => {
          const selected = tab === value;
          return (
            <Pressable
              key={value}
              onPress={() => {
                setTab(value);
                setError(null);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[styles.tab, selected && { backgroundColor: isDark ? colors.cardAlt : colors.card }]}
            >
              <BodyStrong color={selected ? colors.ink : colors.inkMuted}>
                {value === 'signin' ? 'Sign in' : 'Create account'}
              </BodyStrong>
            </Pressable>
          );
        })}
      </View>

      {options.reason ? (
        <Small color={colors.inkMuted} style={styles.reason}>
          {options.reason}
        </Small>
      ) : null}

      {registering ? (
        <Field
          label="Your name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          placeholder="e.g. Aisha Bello"
          onSubmitEditing={() => emailRef.current?.focus()}
          onFocus={onFieldFocus}
          testID="auth-name"
        />
      ) : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
        inputRef={emailRef}
        onSubmitEditing={() => passwordRef.current?.focus()}
        onFocus={onFieldFocus}
        testID="auth-email"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        autoComplete={registering ? 'new-password' : 'password'}
        placeholder={registering ? 'At least 8 characters, with a number' : 'Your password'}
        inputRef={passwordRef}
        onSubmitEditing={() => void submit()}
        onFocus={onFieldFocus}
        hint={passwordHint}
        testID="auth-password"
      />

      {error ? (
        <View
          style={[
            styles.error,
            { backgroundColor: alpha('#DC2626', isDark ? 0.2 : 0.08), borderColor: alpha('#DC2626', 0.4) },
          ]}
          accessibilityLiveRegion="polite"
        >
          <Small color={isDark ? '#FCA5A5' : '#B91C1C'}>{error}</Small>
        </View>
      ) : null}

      <View style={styles.submit}>
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.emerald} />
            <Caption color={colors.inkMuted}>{registering ? 'Creating your account…' : 'Signing in…'}</Caption>
          </View>
        ) : (
          <GradientButton
            label={registering ? 'Create account' : 'Sign in'}
            icon={registering ? UserPlus : LogIn}
            size="lg"
            gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
            onPress={() => void submit()}
          />
        )}
      </View>

      <View style={styles.privacy}>
        <ShieldCheck size={14} color={colors.inkSubtle} />
        <Caption color={colors.inkSubtle} style={styles.flex}>
          Your password is never stored in plain text. An account saves quiz results, game scores and favourites.
        </Caption>
      </View>
    </>
  );
}

export function AuthSheetProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { topInset, bottomInset } = useMobileLayout();
  const [options, setOptions] = useState<OpenOptions | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const openAuth = useCallback((next: OpenOptions = {}) => setOptions(next), []);
  const close = useCallback(() => {
    Keyboard.dismiss();
    setOptions(null);
  }, []);
  const value = useMemo(() => ({ openAuth }), [openAuth]);

  useEffect(() => {
    if (!options) {
      setKeyboardHeight(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (event: KeyboardEvent) => setKeyboardHeight(event.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [options]);

  const scrollFieldIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const sheetBottomPad = Math.max(bottomInset, 12) + 20 + (Platform.OS === 'ios' ? 0 : keyboardHeight);

  return (
    <AuthSheetContext.Provider value={value}>
      {children}
      <Modal
        visible={Boolean(options)}
        animationType="slide"
        transparent
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={[styles.scrim, { backgroundColor: colors.scrim, paddingTop: topInset + 12 }]}>
          <Pressable style={styles.scrimTap} onPress={close} accessibilityLabel="Dismiss sign in" />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            style={styles.sheetWrap}
          >
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.paper,
                  paddingBottom: sheetBottomPad,
                  maxHeight: keyboardHeight > 0 ? '92%' : '88%',
                },
              ]}
            >
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={styles.sheetHeader}>
                <View style={styles.flex}>
                  <Overline color={colors.emerald}>Your account</Overline>
                  <Title>Stories of Islam</Title>
                </View>
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={[styles.close, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <X size={18} color={colors.ink} />
                </Pressable>
              </View>
              <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.sheetBody, { paddingBottom: keyboardHeight > 0 ? 28 : 12 }]}
              >
                {options ? (
                  <AuthForm
                    key={options.tab ?? 'signin'}
                    options={options}
                    onClose={close}
                    onFieldFocus={scrollFieldIntoView}
                  />
                ) : null}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </AuthSheetContext.Provider>
  );
}

export function useAuthSheet(): AuthSheetContextValue {
  const value = useContext(AuthSheetContext);
  if (!value) throw new Error('useAuthSheet must be used within AuthSheetProvider');
  return value;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  scrim: { flex: 1, justifyContent: 'flex-end' },
  scrimTap: { ...StyleSheet.absoluteFill },
  sheetWrap: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  sheet: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingTop: 10,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 8 },
  sheetBody: { paddingHorizontal: 20, gap: 14 },
  close: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', borderRadius: radius.pill, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.pill },
  reason: { marginTop: -2 },
  field: { gap: 6 },
  fieldLabel: { fontWeight: '800' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  error: { borderWidth: 1, borderRadius: radius.md, padding: 12 },
  submit: { marginTop: 2 },
  busy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 50 },
  privacy: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  doneBox: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  doneIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
