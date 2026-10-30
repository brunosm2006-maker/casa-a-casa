import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { fromInput, inputDate, type Home, type Schedule } from './calendar';
import { isWeekly, templateDays, validateRoutine, type DayRule, type Routine } from './routine';
import { blockTemplate, detectPattern, makeCycle, makeMonths, makePrimary, patternOptions, type Pattern } from './patternTemplates';
import { previewCycles, type PreviewCycle } from './routinePreview';
import { RoutineFields } from './RoutineFields';
import { CycleFields, type CycleName, type EditableBlock, type Period } from './CycleFields';
import { PrimaryFields } from './PrimaryFields';
import { RoutineReview } from './RoutineReview';
import { StartField } from './RoutineControls';
import { type Profile } from './persistence';
import { Button } from './ui';
import { s } from './theme';

export function RoutineScreen({ routine, exceptions, profile, today, saving, storageError, onSave, onClose, onStep }: {
  routine: Routine | null; exceptions: Schedule; profile: Profile; today: string; saving: boolean; storageError: string;
  onSave: (routine: Routine) => Promise<boolean>; onClose: () => void; onStep: () => void;
}) {
  const weekly = routine && isWeekly(routine) ? routine : null;
  const [step, setStep] = useState(1);
  const [pattern, setPattern] = useState<Pattern | null>(() => detectPattern(routine));
  const [start, setStart] = useState(inputDate(routine?.start ?? today));
  const [days, setDays] = useState<DayRule[]>(() => [...(weekly?.days ?? templateDays)]);
  const [friday, setFriday] = useState(weekly?.referenceFriday ? inputDate(weekly.referenceFriday) : '');
  const [referenceHome, setReferenceHome] = useState<Home | null>(weekly?.referenceHome ?? null);
  const [otherWeekendHome, setOtherWeekendHome] = useState<Home | null>(weekly?.otherWeekendHome ?? null);
  const [first, setFirst] = useState<Home | null>(routine?.kind === 'months' ? routine.firstHome : routine?.kind === 'cycle' ? routine.blocks[0]?.home ?? null : null);
  const [period, setPeriod] = useState<Period>(routine?.kind === 'months' ? 'months' : routine?.kind === 'cycle' && routine.blocks[0]?.days === 15 ? '15' : '14');
  const [cycle, setCycle] = useState<CycleName>(routine?.kind === 'cycle' && ['223','2255','3443'].includes(routine.template) ? routine.template as CycleName : '223');
  const [blocks, setBlocks] = useState<EditableBlock[]>(() => routine?.kind === 'cycle' ? routine.blocks.map(block => ({ home: block.home, days: String(block.days) })) : [{ home: 'madre', days: '9' }, { home: 'padre', days: '5' }]);
  const [primaryHome, setPrimaryHome] = useState<Home | null>(weekly?.primary?.home ?? weekly?.otherWeekendHome ?? null);
  const [guest, setGuest] = useState<Home | null>(weekly?.primary?.guest ?? weekly?.referenceHome ?? null);
  const [visitDays, setVisitDays] = useState<number[]>(() => weekly?.primary ? [...weekly.primary.visitDays] : weekly && detectPattern(weekly) === 'primary' ? weekly.days.flatMap((day,i) => day === 'alterno' || (weekly.referenceHome && day === weekly.referenceHome) ? [i] : []) : [4,5,6]);
  const [alternate, setAlternate] = useState(weekly?.primary?.alternate ?? true);
  const [review, setReview] = useState<{ routine: Routine; cycles: PreviewCycle[] } | null>(null);
  const [error, setError] = useState('');
  const go = (next: number) => { setError(''); setStep(next); onStep(); };

  function choose(next: Pattern) {
    if (next === 'weekly' && next !== pattern) {
      setDays([...templateDays]);
      setOtherWeekendHome(referenceHome ? (referenceHome === 'madre' ? 'padre' : 'madre') : null);
    }
    setPattern(next);
  }
  function prepareReview() {
    setError('');
    try {
      const date = fromInput(start);
      let next: Routine;
      if (pattern === 'weekly') {
        const alternating = days.includes('alterno');
        next = { kind: 'weekly', start: date, days: [...days], referenceFriday: alternating && friday ? fromInput(friday) : null,
          referenceHome: alternating ? referenceHome : null, otherWeekendHome: alternating ? otherWeekendHome : null };
      } else if (pattern === 'primary') {
        if (!guest) throw new Error('Elige el progenitor de las otras estancias.');
        next = makePrimary(date, { home: primaryHome, guest, visitDays: [...visitDays], alternate },
          alternate && visitDays.some(day => day >= 4) && friday ? fromInput(friday) : null);
      } else if (pattern === 'custom') {
        if (blocks.some(block => !/^\d+$/.test(block.days))) throw new Error('Escribe un número entero de días en cada bloque.');
        next = makeCycle(date, blocks.map(block => ({ home: block.home, days: Number(block.days) })), 'custom');
      } else {
        if (!first) throw new Error('Elige el primer progenitor.');
        if (pattern === 'long' && period === 'months') next = makeMonths(date, first);
        else if (pattern === 'cycles') next = makeCycle(date, blockTemplate(cycle, first), cycle);
        else {
          const length = pattern === 'weeks' ? 7 : Number(period);
          next = makeCycle(date, [{ days: length, home: first }, { days: length, home: first === 'madre' ? 'padre' : 'madre' }], pattern === 'weeks' ? 'weeks' : 'long');
        }
      }
      validateRoutine(next);
      const cycles = previewCycles(next, exceptions);
      setReview({ routine: next, cycles });
      go(3);
    } catch (err) { setError(err instanceof Error ? err.message : 'Revisa las respuestas.'); }
  }

  return <View style={{ gap: 20 }}>
    <Text style={s.eyebrow}>TU RUTINA · PASO {step} DE 3</Text>
    <Text accessibilityRole="header" style={s.title}>{step === 1 ? '¿Cómo os organizáis habitualmente?' : step === 2 ? 'Cuéntanos tu rutina' : 'Revisa tus respuestas'}</Text>
    {step === 1 && <>
      <Text style={s.body}>{profile === 'hijo' || profile === 'hija' ? 'Elige cómo se reparten tus estancias.' : 'Elige cómo se reparten las estancias de tu hijo o hija.'} El calendario se completará desde la fecha que indiques y continuará en los años siguientes.</Text>
      {patternOptions.map(option => <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.title}
        aria-checked={pattern === option.id} accessibilityState={{ checked: pattern === option.id }} onPress={() => choose(option.id)} style={[s.choice, pattern === option.id && s.chosen]}>
        <Text style={s.heading}>{option.title}{pattern === option.id ? ' ✓' : ''}</Text><Text style={s.body}>{option.text}</Text>
      </Pressable>)}
      <Button label="Continuar" disabled={!pattern} onPress={() => go(2)} />
    </>}
    {step === 2 && pattern && <>
      <Text style={s.muted}>No se guardará ninguna plantilla hasta que revises dos ciclos completos y confirmes.</Text>
      <Text style={s.muted}>Asignamos una casa por fecha, para el día completo y su noche. Las visitas por horas y las noches separadas del día quedan para más adelante.</Text>
      {pattern === 'weekly' ? <RoutineFields pattern="weekly" {...{ start, setStart, days, setDays, friday, setFriday, referenceHome, otherWeekendHome, setOtherWeekendHome, saving }}
        setReferenceHome={home => { setReferenceHome(home); setOtherWeekendHome(home === 'madre' ? 'padre' : 'madre'); }} /> : <>
        <StartField value={start} onChange={setStart} />
        {pattern === 'primary' ? <PrimaryFields home={primaryHome} setHome={setPrimaryHome} {...{ guest, setGuest, alternate, setAlternate, friday, setFriday }} days={visitDays} setDays={setVisitDays} /> :
          <CycleFields {...{ pattern, first, setFirst, period, setPeriod, cycle, setCycle, blocks, setBlocks }} />}
      </>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Button label="Revisar respuestas" onPress={prepareReview} />
      <Button label="Volver al tipo de rutina" secondary onPress={() => go(1)} />
    </>}
    {step === 3 && review && <>
      <RoutineReview routine={review.routine} cycles={review.cycles} />
      <Text style={s.muted}>No se programarán avisos. Los cambios puntuales se conservarán.</Text>
      {!!storageError && <Text accessibilityRole="alert" style={s.error}>{storageError}</Text>}
      <Button label={saving ? 'Guardando…' : 'Guardar rutina y ver calendario'} disabled={saving} onPress={async () => { await onSave(review.routine); }} />
      <Button label="Cambiar respuestas" secondary disabled={saving} onPress={() => go(2)} />
    </>}
    <Button label={routine ? 'Cancelar' : 'Ahora no · usar calendario manual'} secondary disabled={saving} onPress={onClose} />
  </View>;
}
