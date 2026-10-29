import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { displayDate, fromInput, inputDate, type Home } from './calendar';
import { templateDays, validateRoutine, type DayRule, type Routine } from './routine';
import { RoutineFields, dayNames, type Pattern } from './RoutineFields';
import { type Profile } from './persistence';
import { Button } from './ui';
import { s } from './theme';

export function RoutineScreen({ routine, profile, today, saving, storageError, onSave, onClose, onStep }: {
  routine: Routine | null; profile: Profile; today: string; saving: boolean; storageError: string;
  onSave: (routine: Routine) => Promise<boolean>; onClose: () => void; onStep: () => void;
}) {
  const [step, setStep] = useState(1);
  const [pattern, setPattern] = useState<Pattern | null>(routine ? (routine.days.slice(0, 4).every(day => day === routine.days[0]) && routine.days.slice(4).every(day => day === 'alterno') ? 'weekends' : 'weekly') : null);
  const [start, setStart] = useState(inputDate(routine?.start ?? today));
  const [days, setDays] = useState<DayRule[]>(() => [...(routine?.days ?? templateDays)]);
  const [friday, setFriday] = useState(routine?.referenceFriday ? inputDate(routine.referenceFriday) : '');
  const [referenceHome, setReferenceHome] = useState<Home | null>(routine?.referenceHome ?? null);
  const [otherWeekendHome, setOtherWeekendHome] = useState<Home | null>(routine?.otherWeekendHome ?? null);
  const [review, setReview] = useState<Routine | null>(null);
  const [error, setError] = useState('');
  const go = (next: number) => { setError(''); setStep(next); onStep(); };

  function choose(next: Pattern) {
    if (next !== pattern) {
      setDays(next === 'weekly' ? [...templateDays] : [null, null, null, null, 'alterno', 'alterno', 'alterno']);
      setOtherWeekendHome(next === 'weekly' && referenceHome ? (referenceHome === 'madre' ? 'padre' : 'madre') : null);
    }
    setPattern(next);
  }

  function prepareReview() {
    setError('');
    try {
      const alternating = days.includes('alterno');
      const next: Routine = { start: fromInput(start), days: [...days], referenceFriday: alternating && friday ? fromInput(friday) : null,
        referenceHome: alternating ? referenceHome : null, otherWeekendHome: alternating ? otherWeekendHome : null };
      validateRoutine(next);
      setReview(next);
      go(3);
    } catch (err) { setError(err instanceof Error ? err.message : 'Revisa las respuestas.'); }
  }

  return <View style={{ gap: 20 }}>
    <Text style={s.eyebrow}>TU RUTINA · PASO {step} DE 3</Text>
    <Text accessibilityRole="header" style={s.title}>{step === 1 ? (profile === 'hijo' || profile === 'hija' ? '¿Con quién te toca cada día?' : '¿Cómo se reparte la custodia?') : step === 2 ? 'Cuéntanos tu rutina' : 'Revisa tus respuestas'}</Text>
    {step === 1 && <>
      <Text style={s.body}>Elige cómo es el reparto habitual. Con unas respuestas completaremos el calendario desde la fecha que indiques, también para los años siguientes.</Text>
      {([{ id: 'weekly', title: 'Reparto semanal', text: 'Configura los días con cada progenitor. Ejemplo editable: lunes y martes con madre, miércoles y jueves con padre y viernes a domingo alternos.' },
        { id: 'weekends', title: 'Fines de semana alternos', text: 'Un fin de semana cada dos semanas. Elige el primero y decide si quieres asignar el resto de días.' }] as const).map(option =>
        <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.title} accessibilityState={{ checked: pattern === option.id }}
          onPress={() => choose(option.id)} style={[s.choice, pattern === option.id && s.chosen]}>
          <Text style={s.heading}>{option.title}{pattern === option.id ? ' ✓' : ''}</Text><Text style={s.body}>{option.text}</Text>
        </Pressable>)}
      <Button label="Continuar" disabled={!pattern} onPress={() => go(2)} />
    </>}
    {step === 2 && pattern && <>
      <Text style={s.muted}>Las opciones son una plantilla editable. No se guardarán hasta que revises y confirmes la rutina.</Text>
      <RoutineFields {...{ pattern, start, setStart, days, setDays, friday, setFriday, referenceHome, otherWeekendHome, setOtherWeekendHome, saving }}
        setReferenceHome={home => { setReferenceHome(home); if (pattern === 'weekly') setOtherWeekendHome(home === 'madre' ? 'padre' : 'madre'); }} />
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Button label="Revisar respuestas" onPress={prepareReview} />
      <Button label="Volver al tipo de rutina" secondary onPress={() => go(1)} />
    </>}
    {step === 3 && review && <>
      <View style={s.card}>
        <Text style={s.heading}>Desde el {displayDate(review.start)}</Text>
        {dayNames.map((name, index) => <Text key={name} style={s.body}>{name}: {review.days[index] === 'alterno' ? `${review.referenceHome} / ${review.otherWeekendHome ?? 'sin asignar'}, en semanas alternas` : review.days[index] ?? 'sin asignar'}.</Text>)}
        {review.referenceFriday && <Text style={s.body}>Fin de semana de referencia: viernes {displayDate(review.referenceFriday)}, con {review.referenceHome}. Los siguientes turnos se calculan desde esa fecha.</Text>}
      </View>
      <Text style={s.body}>Se aplicará automáticamente en los meses y años siguientes. Podrás cambiar fechas concretas para vacaciones o festivos sin modificar esta rutina.</Text>
      <Text style={s.muted}>Tus cambios puntuales anteriores se conservarán y tendrán prioridad. No se programarán avisos.</Text>
      {!!storageError && <Text accessibilityRole="alert" style={s.error}>{storageError}</Text>}
      <Button label={saving ? 'Guardando…' : 'Guardar rutina y ver calendario'} disabled={saving} onPress={async () => { await onSave(review); }} />
      <Button label="Cambiar respuestas" secondary disabled={saving} onPress={() => go(2)} />
    </>}
    <Button label={routine ? 'Cancelar' : 'Ahora no · usar calendario manual'} secondary disabled={saving} onPress={onClose} />
  </View>;
}
