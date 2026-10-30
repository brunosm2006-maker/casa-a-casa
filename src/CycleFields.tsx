import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { type Home } from './calendar';
import { type Pattern } from './patternTemplates';
import { Choice, homeOptions } from './RoutineControls';
import { Button } from './ui';
import { s } from './theme';
export type EditableBlock = { days: string; home: Home };
export type CycleName = '223' | '2255' | '3443';
export type Period = '14' | '15' | 'months';
export function CycleFields({ pattern, first, setFirst, period, setPeriod, cycle, setCycle, blocks, setBlocks }: {
  pattern: Pattern; first: Home | null; setFirst: (home: Home) => void; period: Period; setPeriod: (value: Period) => void;
  cycle: CycleName; setCycle: (value: CycleName) => void; blocks: EditableBlock[]; setBlocks: (blocks: EditableBlock[]) => void;
}) {
  const sequence = cycle === '223' ? 'A 2 días → B 2 → A 3 → B 2 → A 2 → B 3' : cycle === '2255' ? 'A 2 días → B 2 → A 5 → B 5' : 'A 3 días → B 4 → A 4 → B 3';
  return <>
    {pattern === 'long' && <View style={s.card}>
      <Choice title="Duración de cada turno" value={period} onChange={setPeriod} options={[
        { value: '14', label: '14 días' }, { value: '15', label: '15 días' }, { value: 'months', label: 'Meses naturales' },
      ]} />
      <Text style={s.muted}>{period === 'months' ? 'Un mes natural con cada progenitor. El inicio debe ser el día 1; cada turno termina el último día de ese mes. No son bloques de 30 días.' : 'Los turnos se cuentan en días consecutivos desde el inicio elegido. Puede ser cualquier día de la semana.'}</Text>
    </View>}
    {pattern === 'cycles' && <View style={s.card}>
      <Choice title="Tipo de ciclo" value={cycle} onChange={setCycle} options={[
        { value: '223', label: '2–2–3' }, { value: '2255', label: '2–2–5–5' }, { value: '3443', label: '3–4–4–3' },
      ]} />
      <Text style={s.body}>{sequence}</Text>
      <Text style={s.muted}>A es el primer progenitor y B el otro. El patrón completo dura 14 días y luego vuelve a empezar.</Text>
      <Text style={s.muted}>{cycle === '223' ? 'Tras los primeros siete días se invierten los turnos de 2, 2 y 3 días.' : cycle === '2255' ? 'Si empiezas un lunes: lunes/martes A, miércoles/jueves B y viernes a domingo A; la semana siguiente mantiene los días fijos y el fin de semana es B.' : 'Primera semana: 3 días A y 4 B. Segunda: 4 días A y 3 B.'}</Text>
    </View>}
    {pattern !== 'custom' && <View style={s.card}>
      <Choice title="Primer progenitor" value={first} options={homeOptions} onChange={value => { if (value) setFirst(value); }} />
      <Text style={s.muted}>La fecha de inicio es el primer día del primer turno. La vista previa mostrará las fechas exactas.</Text>
    </View>}
    {pattern === 'custom' && <View style={{ gap: 16 }}>
      <Text style={s.body}>Estos bloques se repetirán en el mismo orden. Puedes cambiarlos, añadirlos o retirarlos.</Text>
      {blocks.map((block, index) => <View key={index} style={s.card}>
        <Text style={s.heading}>Bloque {index + 1}</Text>
        <Text style={s.body}>Días consecutivos</Text>
        <TextInput accessibilityLabel={'Días del bloque ' + (index + 1)} value={block.days} keyboardType="number-pad"
          onChangeText={days => setBlocks(blocks.map((value, i) => i === index ? { ...value, days } : value))} style={s.input} maxLength={2} />
        <Choice title={'Progenitor del bloque ' + (index + 1)} value={block.home} options={homeOptions}
          onChange={home => setBlocks(blocks.map((value, i) => i === index ? { ...value, home } : value))} />
        <Button label={'Quitar bloque ' + (index + 1)} secondary disabled={blocks.length <= 2} onPress={() => setBlocks(blocks.filter((_, i) => i !== index))} />
      </View>)}
      <Button label="Añadir bloque" secondary disabled={blocks.length >= 12} onPress={() => setBlocks([...blocks, { days: '1', home: blocks[blocks.length - 1]?.home === 'madre' ? 'padre' : 'madre' }])} />
      <Text style={s.muted}>De 2 a 12 bloques. Cada bloque, de 1 a 60 días enteros. El ciclo completo admite hasta 90 días y debe incluir a ambos progenitores.</Text>
    </View>}
  </>;
}
