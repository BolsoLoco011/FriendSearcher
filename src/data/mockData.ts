import { CategoryCardInfo, FriendProfile, MemeItem, CookingItem, EventItem, GroupItem, GymItem, SportItem } from '../types';

export const CARACTERISTICAS_CATEGORY: CategoryCardInfo = {
  key: 'caracteristicas',
  title: 'Características',
  subtitle: 'Afinidad & Pasiones',
  badge: '4K • ULTRA HD',
  image: '/abc.png',
  countLabel: 'DEPORTES • MUSICA • JUEGOS & MÁS',
  color: 'from-sky-500 to-indigo-600',
  iconName: 'Sparkles',
  description: 'Filtra y conecta por DEPORTES, MUSICA, GIMNASIO, VIDEOJUEGOS, NATURALEZA, INFORMATICA y MEMES.'
};

export const CATEGORIES_DATA: CategoryCardInfo[] = [
  {
    key: 'deportes',
    title: 'Deportes',
    subtitle: 'PSG vs Bayern & El Clásico',
    badge: 'CHAMPIONS & CLÁSICO ⚽',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=85',
    countLabel: 'PSG vs Bayern • Barça vs Madrid • Fútbol 5',
    color: 'from-amber-600 via-rose-700 to-blue-900',
    iconName: 'Trophy',
    description: '¡Partidazo de Champions League PSG vs Bayern Múnich (se vuelven a enfrentar tras las semifinales) y El Clásico! Además arma partidos de fútbol 5, fútbol 7 y torneos deportivos.'
  },
  {
    key: 'memes',
    title: 'Memes',
    subtitle: 'Humor & Shitpost 24/7',
    badge: '4K • ULTRA HD',
    image: '/meme.png',
    countLabel: '98k Compartidos hoy',
    color: 'from-amber-500 to-orange-600',
    iconName: 'Laugh',
    description: 'El humor define una verdadera amistad. Filtra por tipo de humor (sarcástico, absurdo, wholesome o memes de gatos) y conecta riendo.'
  },
  {
    key: 'cocina',
    title: 'Cocina',
    subtitle: 'Foodies & Recetas Caseras',
    badge: '4K • ULTRA HD',
    image: '/comida.png',
    countLabel: '420 Quedadas gastronómicas',
    color: 'from-emerald-500 to-teal-600',
    iconName: 'Utensils',
    description: 'Amantes de la buena comida, catas de café, cocinar juntos pizzas al horno o descubrir los mejores tacos y sushi de la ciudad.'
  },
  {
    key: 'eventos',
    title: 'Eventos',
    subtitle: 'Planes, Conciertos & Juntadas',
    badge: '4K • ULTRA HD',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85',
    countLabel: '64 Próximos eventos',
    color: 'from-fuchsia-500 to-rose-600',
    iconName: 'CalendarCheck',
    description: 'No te pierdas ningún plan. Conéctate para ir a festivales, tardes de juegos de mesa, senderismo de montaña o escapadas de fin de semana.'
  },
  {
    key: 'grupos',
    title: 'Grupos',
    subtitle: 'Comunidades & Squads',
    badge: '4K • ULTRA HD',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85',
    countLabel: '310 Grupos activos',
    color: 'from-blue-600 to-cyan-500',
    iconName: 'Users',
    description: 'Comunidades temáticas con canales de charla y reuniones semanales. Entra en grupos de cinéfilos, programadores, deportistas o artistas.'
  },
  {
    key: 'gimnasio',
    title: 'Gimnasio',
    subtitle: 'Fitness, Gym Buddies & Fuerza',
    badge: '4K • ULTRA HD',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85',
    countLabel: '180 Gym Buddies activos',
    color: 'from-rose-500 to-red-600',
    iconName: 'Dumbbell',
    description: 'Encuentra compañeros de entrenamiento, comparte rutinas de pesas, calistenia, crossfit o planes de superación física y vida saludable.'
  },
  {
    key: 'juegos',
    title: 'Juegos',
    subtitle: 'Minivideojuegos & Arcade',
    badge: '4K • ULTRA HD',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=85',
    countLabel: 'Activos: Snake 1v1 & Ta-Te-Ti',
    color: 'from-violet-600 to-fuchsia-600',
    iconName: 'Gamepad2',
    description: 'Sala de minivideojuegos arcade y desafíos rápidos para disfrutar con amigos. Juega al nuevo Snake 1v1 competitivo comiendo manzanas para crecer y atrapar al rival, o al clásico Ta-Te-Ti.'
  }
];

export const INITIAL_FRIENDS: FriendProfile[] = [
  {
    id: 'f-1',
    name: 'Benja',
    age: 24,
    avatar: '/benja.svg',
    secondaryAvatar: '/benja-cat.svg',
    city: 'Buenos Aires',
    occupation: 'Gamer & Pet Lover',
    bio: 'Soy Benja. Fanático de los buenos planes, memes de calidad, videojuegos y momentos chill con mi gato.',
    matchScore: 98,
    highlightCategory: 'caracteristicas',
    traits: ['CORONA', 'MEMES', 'GATOS', 'DEPORTES', 'Amante de milas'],
    favoriteFood: 'Fideos y Milanesas',
    favoriteMemeStyle: 'Memes de humor absurdo',
    joinedEvent: 'Tarde de gaming y juntada',
    joinedGroup: 'Squad Benja & Amigos',
    isConnected: false
  }
];

export const INITIAL_MEMES: MemeItem[] = [
  {
    id: 'm-1',
    title: 'GENIO !',
    imageUrl: '/genio.svg',
    likes: 1240,
    author: 'Juanma Ipar',
    sharedByFriend: 'Juanma Ipar',
    tag: 'Clásico Amistad',
    userVoted: false
  },
  {
    id: 'm-2',
    title: 'Mi cerebro a las 3 AM decidiendo si empezar un proyecto nuevo o dormir',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80',
    likes: 3410,
    author: 'Comunidad',
    sharedByFriend: 'Comunidad Web',
    tag: 'Existencial',
    userVoted: true
  },
  {
    id: 'm-3',
    title: 'Tú y tu mejor amigo juzgando la comida del delivery con cara de expertos',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
    likes: 890,
    author: 'Benja',
    sharedByFriend: 'Benja',
    tag: 'Foodie Humor',
    userVoted: false
  },
  {
    id: 'm-4',
    title: 'Planificando vacaciones ideales vs el saldo actual de la cuenta bancaria',
    imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80',
    likes: 2150,
    author: 'Comunidad',
    sharedByFriend: 'Comunidad Web',
    tag: 'Realidad Pura',
    userVoted: false
  }
];

export const INITIAL_COOKING: CookingItem[] = [
  {
    id: 'c-1',
    title: 'Taller de Pasta Fresca & Salsas Caseras',
    cuisine: 'Italiana Artesanal',
    level: 'Principiante a Medio',
    hostName: 'Benja & Amigos',
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    membersInterested: 18,
    nextGathering: 'Sábado 19:30 hs'
  },
  {
    id: 'c-2',
    title: 'Noche de Tacos Auténticos & Margaritas',
    cuisine: 'Mexicana',
    level: 'Todos los niveles',
    hostName: 'Chef Local',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    membersInterested: 26,
    nextGathering: 'Viernes 21:00 hs'
  },
  {
    id: 'c-3',
    title: 'Ruta del Mejor Café de Especialidad & Brunch',
    cuisine: 'Cafetería & Bakery',
    level: 'Degustación',
    hostName: 'Comunidad Foodie',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    membersInterested: 34,
    nextGathering: 'Domingo 11:00 hs'
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'e-1',
    title: 'Festival Indie & Picnic al Atardecer',
    date: '14 Septiembre',
    time: '17:00 hs',
    location: 'Parque Central / Anfiteatro',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
    attendees: 42,
    categoryTag: 'Música & Aire Libre',
    isJoined: true
  },
  {
    id: 'e-2',
    title: 'Noche de Juegos de Mesa, Catan & Cerveza',
    date: '19 Septiembre',
    time: '20:30 hs',
    location: 'Board Game Café Barrio Norte',
    imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
    attendees: 16,
    categoryTag: 'Juegos & Chill',
    isJoined: false
  },
  {
    id: 'e-3',
    title: 'Cine Bajo Las Estrellas: Clásicos de Ciencia Ficción',
    date: '25 Septiembre',
    time: '21:00 hs',
    location: 'Terraza Cultural Centro',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    attendees: 31,
    categoryTag: 'Cine & Comunidad',
    isJoined: false
  }
];

export const INITIAL_GROUPS: GroupItem[] = [
  {
    id: 'g-1',
    name: 'Foodies & Pastelería Experimental',
    description: 'Comunidad para compartir recetas, visitar bodegones y organizar cenas colaborativas los fines de semana.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    members: 142,
    activityLevel: 'Muy activo',
    tags: ['Cocina', 'Brunch', 'Vinos', 'Recetas'],
    isJoined: true
  },
  {
    id: 'g-2',
    name: 'Squad Gaming & Shitpost VIP',
    description: 'Partidas de Discord, memes de medianoche, debates de series y videojuegos multiplayer.',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    members: 285,
    activityLevel: 'Muy activo',
    tags: ['Gamer', 'Discord', 'Memes', 'Streaming'],
    isJoined: false
  },
  {
    id: 'g-3',
    name: 'Ruta de Recitales & Cineclub',
    description: 'Para los que no les gusta ir solos a los conciertos ni al cine. Armamos previa y vamos en grupo.',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    members: 98,
    activityLevel: 'Activo',
    tags: ['Música', 'Cine', 'Festivales', 'Salidas'],
    isJoined: false
  },
  {
    id: 'g-4',
    name: 'Aventuras Outdoors & Senderismo',
    description: 'Salidas de fin de semana, trekking, acampadas, rutas en bicicleta y desconexión de la ciudad.',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
    members: 174,
    activityLevel: 'Activo',
    tags: ['Trekking', 'Naturaleza', 'Fotografía', 'Camping'],
    isJoined: false
  }
];

export const INITIAL_GYM: GymItem[] = [
  {
    id: 'gym-1',
    title: 'Rutina Push / Pull & Hipertrofia',
    activity: 'Fuerza & Musculación',
    location: 'SmartFit / Gym Central',
    hostName: 'Benja',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    membersCount: 14,
    schedule: 'Lunes a Jueves • 19:00 hs',
    isJoined: true,
    notes: 'Entrenamiento enfocado en progresiones de cargas, técnica limpia y buena onda para motivarse.'
  },
  {
    id: 'gym-2',
    title: 'Calistenia en Barras al Aire Libre',
    activity: 'Calistenia & Peso Corporal',
    location: 'Parque Sarmiento / Barras Urbanas',
    hostName: 'Marcos Díaz',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    membersCount: 22,
    schedule: 'Sábados y Domingos • 10:30 hs',
    isJoined: false,
    notes: 'Dominadas, fondos, handstand y trabajo de core para todos los niveles.'
  },
  {
    id: 'gym-3',
    title: 'Crossfit WOD & Acondicionamiento',
    activity: 'Crossfit Funcional',
    location: 'Box Titanium Fitness',
    hostName: 'Lucía Morales',
    imageUrl: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=80',
    membersCount: 18,
    schedule: 'Martes y Viernes • 18:30 hs',
    isJoined: false,
    notes: 'Entrenamientos de alta intensidad con kettlebells, remos y circuitos grupales.'
  },
  {
    id: 'gym-4',
    title: 'Running 5K/10K & Pista de Atletismo',
    activity: 'Cardio & Running',
    location: 'Circuito Parque de las Naciones',
    hostName: 'Facundo Rossi',
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
    membersCount: 35,
    schedule: 'Miércoles y Sábados • 08:00 hs',
    isJoined: false,
    notes: 'Trote suave y progresivo, ideal para despejarse y ganar resistencia cardiovascular.'
  }
];

export const INITIAL_SPORTS: SportItem[] = [
  {
    id: 'sport-champions',
    title: '¡¡¡PSG VS BAYERN MUNICH POR CHAMPIONS LEAGUE!!!!!!!!!!!',
    sport: 'Champions League • Revancha de Semifinales',
    location: 'Estadio Virtual FriendSearcher & Sports Bar (Pantalla Gigante 4K)',
    hostName: 'Comunidad UEFA & Amigos',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
    playersCount: 56,
    maxPlayers: 70,
    schedule: 'Miércoles • 16:00 hs (Previa 15:00 hs)',
    level: 'Champions League • Hinchas & Pasión Europea',
    isJoined: true,
    notes: '¡¡¡SE VUELVEN A ENFRENTAR TRAS LAS SEMIFINALES!!! PSG vs Bayern Múnich por UEFA Champions League. Revancha europea histórica para vivir en pantalla gigante con amigos, picada libre, camisetas y prode en vivo. ¿Quién avanzará?',
    isChampions: true,
    championsData: {
      psgVotes: 132,
      bayernVotes: 139,
      drawVotes: 21,
      userVote: 'psg'
    }
  },
  {
    id: 'sport-clasico',
    title: '¡¡¡EL CLÁSICO!!!! FC BARCELONA VS REAL MADRID',
    sport: 'El Clásico • Fútbol Mundial',
    location: 'Bar Deportivo La Redonda & Club Social (Pantalla Gigante 4K)',
    hostName: 'Comunidad FriendSearcher',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
    playersCount: 48,
    maxPlayers: 60,
    schedule: 'Domingo • 16:00 hs (Previa 15:00 hs)',
    level: 'Hinchas, Amigos & Pasión Futbolera',
    isJoined: true,
    notes: '¡¡¡EL PARTIDO MÁS ESPERADO DEL MUNDO!!! Gran juntada futbolera para vivir el Clásico en pantalla gigante con amigos, picada, camisetas de ambos equipos y prode en vivo. ¿Quién se queda con el orgullo futbolero?',
    isClasico: true,
    clasicoData: {
      barcaVotes: 142,
      madridVotes: 138,
      drawVotes: 24,
      userVote: 'barca'
    }
  },
  {
    id: 'sport-1',
    title: 'Fútbol 5 Nocturno • ¡Falta 1 para el Partido!',
    sport: 'Fútbol 5',
    location: 'Canchas La Redonda (Sintético techado)',
    hostName: 'Benja',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    playersCount: 9,
    maxPlayers: 10,
    schedule: 'Miércoles • 20:30 hs',
    level: 'Amateur / Intermedio',
    isJoined: true,
    notes: 'Partido mixto semanal entre amigos. Jugamos con pecheras, tercer tiempo con hidratación y charla post-partido.'
  },
  {
    id: 'sport-2',
    title: 'Torneo Relámpago Fútbol 7 de Fin de Semana',
    sport: 'Fútbol 7',
    location: 'Complejo Deportivo El Golazo',
    hostName: 'Marcos Díaz',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    playersCount: 12,
    maxPlayers: 14,
    schedule: 'Sábado • 16:00 hs',
    level: 'Intermedio',
    isJoined: false,
    notes: 'Torneo de 4 equipos, tiempo reducido con árbitro y copa simbólica. ¡Trae tus botines!'
  },
  {
    id: 'sport-3',
    title: 'Pádel Dobles • Nivel 6ta / 5ta',
    sport: 'Pádel',
    location: 'Padel Club Central',
    hostName: 'Lucía Morales',
    imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    playersCount: 3,
    maxPlayers: 4,
    schedule: 'Jueves • 19:00 hs',
    level: 'Amateur / Divertido',
    isJoined: false,
    notes: 'Buscamos 4to jugador/a para completar dobles en cancha de blindex. Pelotas nuevas incluidas.'
  },
  {
    id: 'sport-4',
    title: 'Básquet 3v3 Media Cancha Callejero',
    sport: 'Básquetbol',
    location: 'Parque Urbano • Cancha Azul',
    hostName: 'Facundo Rossi',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    playersCount: 5,
    maxPlayers: 6,
    schedule: 'Domingo • 17:30 hs',
    level: 'Todos los niveles',
    isJoined: false,
    notes: 'Tiradas al aro, 3v3 libre y música de fondo para pasar la tarde con buena vibra.'
  }
];

