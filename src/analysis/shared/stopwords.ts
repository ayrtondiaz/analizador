const EN = `a about above after again against all also am an and any are as at be because been before being below between both
but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if
in into is it its itself just me more most my no nor not now of off on once only or other our out over own same she should so
some such than that the their them then there these they this those through to too under until up us very was we were what
when where which while who whom why will with would you your yours able etc via per including include includes ideal plus
strong good great excellent knowledge skills skill experience experienced years year work working worked team teams role
responsibilities requirements required preferred must looking join company candidate candidates position job benefits
opportunity responsible ability abilities understanding using use used new need needs well within across`;

const ES = `a al algo algun alguna algunas alguno algunos ante antes aqui asi aun aunque cada como con contra cual cuales cuando
de del desde donde dos durante e el ella ellas ellos en entre era eran es esa esas ese eso esos esta estan estar este esto
estos fue fueron ha han hasta hay la las le les lo los mas me mi mis mucho muy nada ni no nos nosotros nuestra nuestro o os otra
otras otro otros para pero poco por porque que quien se sea sean ser si sido sin sobre solo son su sus tambien tanto te
tiene tienen todo todos tu tus un una uno unos y ya yo experiencia anos ano conocimiento conocimientos habilidades
habilidad equipo trabajo trabajar requisitos requeridos deseable buscamos empresa candidato candidatos puesto oferta
responsabilidades capacidad manejo solido buen buena excelente incluye incluyen mediante dentro ademas
nivel contar formar parte`;

export const STOPWORDS: ReadonlySet<string> = new Set(
  [...EN.split(/\s+/), ...ES.split(/\s+/)]
    .map((w) =>
      w
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase(),
    )
    .filter(Boolean),
);
