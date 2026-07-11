const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const now = new Date('2026-07-10T12:00:00');

const planDays = days.map((dayName, index) => {
  const d = new Date(now);
  let currentDay = d.getDay();
  if (currentDay === 0) currentDay = 7;
  const distance = (index + 1) - currentDay;
  d.setDate(d.getDate() + distance);
  
  return {
    dayName,
    dateStr: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
  };
});

console.log(planDays);
