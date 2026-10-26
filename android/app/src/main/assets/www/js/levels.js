/* ============================================================
   CHAIN REACTION WORDS - Level Database
   Each level is a chain of words where every consecutive pair
   forms a strong association or compound word
   (e.g. HOME -> WORK = "homework", WORK -> OUT = "workout").
   Pack difficulty ramps up: more decoys, trickier links.
   Add your own levels here!
   ============================================================ */

window.CRW_PACKS = [

  {   // ---------------- PACK 1 ----------------
    name: "First Links",
    tagline: "Warm up your brain",
    color: "#FF8A3D",
    levels: [
      ["BREAD", "BUTTER", "MILK", "COW", "MOON"],               // butter, milk, cow jumped over the moon
      ["SUN", "HOT", "COLD", "ICE", "CREAM"],                    // sun, hot/cold, ice, ice cream
      ["CAT", "DOG", "BARK", "TREE", "LEAF"],                    // cat & dog, dogs bark, bark of a tree
      ["CAKE", "SLICE", "BREAD", "CRUMB", "COOKIE"],         // slice of cake, slice of bread, breadcrumbs, cookie crumbs
      ["SOCK", "SHOE", "FOOT", "BALL", "GAME"],                  // sock, shoe, foot, football, ball game
      ["EGG", "CHICKEN", "NUGGET", "GOLD", "RING"],              // egg, chicken nugget, gold nugget, gold ring
      ["NIGHT", "OWL", "EYE", "GLASSES", "WATER"],               // night owl, owl eyes, eyeglasses, glasses of water
      ["ICE", "CREAM", "CAKE", "BIRTHDAY", "PARTY"],             // ice cream, cream cake, birthday cake, party
      ["MILK", "COW", "BOY", "SCOUT", "CAMP"],                   // milk, cow, cowboy, boy scout, scout camp
      ["BED", "DREAM", "STAR", "FISH", "SANDWICH"]               // bed, dream big, starfish, fish sandwich
    ]
  },

  {   // ---------------- PACK 2 ----------------
    name: "Around the House",
    tagline: "Home sweet compound",
    color: "#3FC1C9",
    levels: [
      ["KITCHEN", "SPOON", "SOUP", "SALAD", "DRESS"],            // kitchen, soup spoon, soup & salad, salad dressing
      ["DOOR", "KEY", "PIANO", "MUSIC", "DANCE"],               // door key, piano keys, piano music, dance
      ["CAKE", "CANDLE", "FIRE", "WOOD", "TABLE"],              // cake candle, candle fire, firewood, wooden table
      ["SHOE", "LACE", "CURTAIN", "CALL", "PHONE"],              // shoelace, lace curtain, curtain call, phone call
      ["BOOK", "WORM", "APPLE", "PIE", "CHART"],                // bookworm, worm in an apple, apple pie, pie chart
      ["HOME", "WORK", "OUT", "SPACE", "SHIP"],                  // homework, workout, outer space, spaceship
      ["HOUSE", "FLY", "SUPER", "HERO", "CAPE"],                // housefly, super fly, superhero, hero cape
      ["LIGHT", "HOUSE", "BOAT", "RACE", "HORSE"],               // light, lighthouse, houseboat, boat race, racehorse
      ["GOLD", "FISH", "STICK", "NOTE", "BOOK"],                 // gold, goldfish, fish sticks, sticky note, notebook
      ["BATH", "ROOM", "KEY", "HOLE", "GOLF", "CLUB"]            // bathroom, room key, keyhole, golf hole, golf club
    ]
  },

  {   // ---------------- PACK 3 ----------------
    name: "The Great Outdoors",
    tagline: "Nature's connections",
    color: "#5BC85B",
    levels: [
      ["OCEAN", "WAVE", "RADIO", "SONG", "BIRD"],                // ocean wave, radio waves, radio song, songbird
      ["MOUNTAIN", "TOP", "HAT", "WITCH", "BROOM"],              // mountain top, top hat, witch's hat, witch's broom
      ["RIVER", "BANK", "MONEY", "PAPER", "CUT"],                // riverbank, bank & money, paper money, papercut
      ["DESERT", "SAND", "CASTLE", "KING", "CROWN"],             // desert sand, sandcastle, castle king, king's crown
      ["FOREST", "TREE", "HOUSE", "GHOST", "SHEET"],             // forest, treehouse, haunted house, ghost in a sheet
      ["STORM", "CLOUD", "NINE", "CAT", "WHISKERS"],             // storm cloud, cloud nine, cat's nine lives, whiskers
      ["RAIN", "BOW", "ARROW", "HEART", "BEAT"],                 // rainbow, bow & arrow, cupid's arrow, heartbeat
      ["WATER", "FALL", "SEASON", "SALT", "PEPPER"],             // waterfall, fall season, seasoning salt, salt & pepper
      ["FLOWER", "POT", "LUCK", "CHARM", "SCHOOL"],              // flowerpot, potluck, lucky charm, charm school
      ["GARDEN", "GNOME", "HAT", "WINTER", "SNOWMAN"]            // garden gnome, gnome hat, winter hat, snowman
    ]
  },

  {   // ---------------- PACK 4 ----------------
    name: "Food & Games",
    tagline: "Tasty brain teasers",
    color: "#FF5E78",
    levels: [
      ["PIZZA", "CHEESE", "MOUSE", "HOLE", "DONUT"],             // pizza cheese, cheese & mouse, mousehole, donut hole
      ["SUGAR", "SPICE", "NICE", "GIRL", "POWER"],              // sugar & spice & everything nice, girl power
      ["BALL", "POINT", "STAR", "LIGHT", "BULB"],                // ballpoint, star points, starlight, lightbulb
      ["PLAY", "DOUGH", "COOKIE", "MONSTER", "BLUE"],            // playdough, cookie dough, Cookie Monster, big blue
      ["PENCIL", "ERASER", "GUM", "BUBBLE", "BATH"],             // pencil eraser, gum eraser, bubble gum, bubble bath
      ["RULER", "KING", "CHESS", "BOARD", "GAME"],               // a king rules, chess king, chessboard, board game
      ["SAND", "WITCH", "MAGIC", "TRICK", "CARD"],               // sandwich, witchcraft magic, magic trick, card trick
      ["BLACK", "BOARD", "SURF", "WAVE", "GOODBYE"],             // blackboard, surfboard, surf wave, wave goodbye
      ["FOOT", "BALL", "PARK", "BENCH", "PRESS"],                // football, ballpark, park bench, bench press
      ["BREAK", "FAST", "FOOD", "FIGHT", "CLUB"]                 // breakfast, fast food, food fight, fight club
    ]
  },

  {   // ---------------- PACK 5 ----------------
    name: "World Tour",
    tagline: "Links across the globe",
    color: "#4E9DF7",
    levels: [
      ["EGYPT", "PYRAMID", "TRIANGLE", "MUSIC", "STUDIO"],      // Egypt pyramids, pyramid shape, music triangle, music studio
      ["PARIS", "TOWER", "TALL", "GIANT", "BEAN"],               // Paris tower, tall, giant, Jack's beanstalk
      ["JAPAN", "RICE", "SUSHI", "ROLL", "COASTER"],             // Japanese rice, sushi, sushi roll, rollercoaster
      ["ITALY", "PASTA", "NOODLE", "BRAIN", "STORM"],            // Italian pasta, pasta noodles, use your noodle, brainstorm
      ["INDIA", "TIGER", "STRIPE", "ZEBRA", "CROSSING"],        // India tigers, tiger stripes, zebra stripes, zebra crossing
      ["BRAZIL", "SOCCER", "GOAL", "NET", "FISHING"],            // Brazil soccer, soccer goal, goal net, fishing net
      ["ENGLAND", "ROYAL", "FAMILY", "TREE", "HOUSE"],           // England royals, royal family, family tree, treehouse
      ["CHINA", "TEA", "CUP", "CAKE", "WALK"],                   // Chinese tea, teacup, cupcake, cakewalk
      ["GREECE", "YOGURT", "FRUIT", "BASKET", "BALL"],           // Greek yogurt, fruit yogurt, fruit basket, basketball
      ["MEXICO", "TACO", "SHELL", "BEACH", "BALL", "ROOM"]      // Mexican taco, taco shell, seashell beach, beach ball, ballroom
    ]
  },

  {   // ---------------- PACK 6 ----------------
    name: "Mind Benders",
    tagline: "The trickiest chains",
    color: "#B479FF",
    levels: [
      ["KEY", "BOARD", "GAME", "OVER", "MOON"],                   // keyboard, board game, game over, over the moon
      ["HAND", "STAND", "STILL", "CAMERA", "ACTION", "FIGURE"],  // handstand, stand still, still camera, action!, action figure
      ["BUTTER", "FLY", "PAPER", "CUT", "FINGER", "NAIL"],       // butterfly, flypaper, papercut, cut finger, fingernail
      ["SNAP", "DRAGON", "FRUIT", "CAKE", "WALK"],                // snapdragon, dragon fruit, fruitcake, cakewalk
      ["EYE", "BROW", "BEAT", "DRUM", "STICK", "CHICKEN"],        // eyebrow, browbeat, beat the drum, drumstick, chicken drumstick
      ["SPACE", "SHIP", "WRECK", "BALL", "PARK", "RANGER"],      // spaceship, shipwreck, wrecking ball, ballpark, park ranger
      ["DOWN", "TOWN", "CITY", "LIMIT", "BREAK", "DANCE"],        // downtown, town & city, city limit, limit break, breakdance
      ["SECOND", "HAND", "BAG", "LADY", "BUG", "SPRAY"],         // secondhand, handbag, bag lady, ladybug, bug spray
      ["TOOTH", "FAIRY", "TALE", "WHALE", "SHARK", "WEEK"],       // tooth fairy, fairy tale, whale tail(tale), whale shark, Shark Week
      ["SUN", "GLASSES", "WATER", "FALL", "OUT", "CAST", "AWAY", "GAME"] // sunglasses, glasses of water, waterfall, fallout, outcast, cast away, away game
    ]
  },

  {   // ---------------- PACK 7 ----------------
    name: "Bonus Benders",
    tagline: "The finale mix",
    color: "#FF9F1C",
    levels: [
      ["POP", "CORN", "DOG", "HOT", "SUN"],                      // popcorn, corn dog, hot dog, hot sun
      ["FIRE", "PLACE", "MAT", "GYM", "RAT"],                    // fireplace, placemat, gym mat, gym rat
      ["HEAD", "BAND", "ROCK", "STAR", "FISH"],                  // headband, rock band, rock star, starfish
      ["GREEN", "TEA", "POT", "LUCK", "DRAW"],                   // green tea, teapot, potluck, lucky draw
      ["UNDER", "SEA", "SHELL", "SHOCK", "WAVE"],                // undersea, seashell, shell shock, shock wave
      ["SPACE", "BAR", "TENDER", "LOVE", "LETTER"],              // space bar, bartender, tender love, love letter
      ["COW", "BOY", "FRIEND", "ZONE", "OUT"],                   // cowboy, boyfriend, friend zone, zone out
      ["SUN", "FLOWER", "CHILD", "PLAY", "GROUND"],              // sunflower, flower child, child's play, playground
      ["STAR", "GATE", "WAY", "HIGH", "LAND"],                   // stargate, gateway, highway, highland
      ["TIME", "TABLE", "TENNIS", "SHOE", "LACE"]               // timetable, table tennis, tennis shoe, shoelace
    ]
  },

  {   // ---------------- PACK 8 ----------------
    name: "Grand Finale",
    tagline: "The best compounds in the game",
    color: "#F4A261",
    levels: [
      ["MOON", "LIGHT", "HOUSE", "WORK", "SHOP"],               // moonlight, lighthouse, housework, workshop
      ["STAR", "FISH", "TANK", "TOP", "HAT"],                   // starfish, fish tank, tank top, top hat
      ["ICE", "HOCKEY", "STICK", "NOTE", "BOOK"],               // ice hockey, hockey stick, sticky note, notebook
      ["TURTLE", "DOVE", "SOAP", "OPERA", "SINGER"],            // turtle dove, dove soap, soap opera, opera singer
      ["TELE", "PHONE", "BOOK", "END", "LESS"],                  // telephone, phone book, bookend, endless
      ["HONEY", "MOON", "WALK", "PARK", "BENCH"],                // honeymoon, moonwalk, walk in the park, park bench
      ["COW", "BOY", "BAND", "AID", "KIT"],                       // cowboy, boy band, band-aid, first aid kit
      ["FIRE", "FLY", "WHEEL", "FORTUNE", "COOKIE"],            // firefly, flywheel, wheel of fortune, fortune cookie
      ["JELLY", "FISH", "BONE", "DRY", "CLEAN"],                 // jellyfish, fishbone, bone dry, dry clean
      ["SUPER", "HERO", "SANDWICH", "PICKLE", "JAR"]            // superhero, hero sandwich, sandwich pickle, pickle jar
    ]
  }
];

/* Decoy difficulty: how many fake tiles are mixed into the grid
   (scales with global level index 0..59). */
window.CRW_decoys = function (globalIndex) {
  return Math.min(2 + Math.floor(globalIndex / 9), 8);
};