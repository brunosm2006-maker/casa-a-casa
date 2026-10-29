import { StyleSheet } from 'react-native';

export const colors = {
  paper: '#F6F5EF', surface: '#FFFFFF', ink: '#203B34', muted: '#5B6E65',
  line: '#DCE3DB', green: '#285C48', soft: '#EAF0E7',
  madre: '#E9E5F3', madreInk: '#584A79', padre: '#F8E8D8', padreInk: '#80512B',
  error: '#9B3333',
};

export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, paddingBottom: 32, gap: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: colors.muted },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -1, color: colors.ink },
  heading: { fontSize: 21, fontWeight: '600', color: colors.ink },
  body: { fontSize: 15, lineHeight: 23, color: colors.ink },
  muted: { fontSize: 13, lineHeight: 20, color: colors.muted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 20, gap: 16 },
  button: { minHeight: 46, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green },
  secondary: { backgroundColor: colors.soft },
  buttonText: { color: colors.surface, fontSize: 15, fontWeight: '600' },
  secondaryText: { color: colors.ink },
  disabled: { opacity: 0.45 },
  choice: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 14, gap: 4 },
  chosen: { borderColor: colors.green, backgroundColor: colors.soft, borderWidth: 2, padding: 13 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, minHeight: 48, color: colors.ink, fontSize: 16, backgroundColor: colors.surface },
  error: { color: colors.error, fontSize: 14, lineHeight: 21 },
  nav: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.line, padding: 8, gap: 8 },
  navItem: { flex: 1, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
