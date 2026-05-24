setup.bathSchedule = {
    garden:     { from: '16:00', to: '20:00', p: 10 },
    forest:     { from: '16:00', to: '08:00', p: 20 },
    kitchen:    { from: '12:00', to: '20:00', p: 10 },
    scavenging: { from: '20:00', to: '23:00', p: 30 },
    mistress:   { from: '23:00', to: '24:00', p: 70 },
    streets:    { from: '10:00', to: '12:00', p: 20 },
    nightclub:  { from: '19:00', to: '02:00', p: 60 },
    school:     { from: '15:00', to: '22:00', p: 60 }
};

// Hours when outside-assigned slaves are physically away from the basement.
// Outside these windows they are back and can be included in mass shower.
setup.outsideWorkHours = {
    garden:    { from: '08:00', to: '16:00' },
    forest:    { from: '08:00', to: '16:00' },
    milk_barn: { from: '12:00', to: '18:00' },
    strip_club:{ from: '18:00', to: '04:00' },
    nightclub: { from: '20:00', to: '04:00' },
    streets:   { from: '14:00', to: '06:00' },
};