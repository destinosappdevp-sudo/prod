interface iAppProps {
  name: string;
  title: {
    en: string;
    es: string;
  };
  imageUrl: string;
  description: {
    en: string;
    es: string;
  };
  id: number;
}

export const categoryItems: iAppProps[] = [
  {
    id: 0,
    name: "trending",
    description: {
      en: "This is a Property which is trending.",
      es: "Esta es una propiedad que está en tendencia.",
    },
    title: {
      en: "Trending",
      es: "Tendencia",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/3726d94b-534a-42b8-bca0-a0304d912260.jpg",
  },
  {
    id: 1,
    name: "beach",
    description: {
      en: "This Property is close to the Beach.",
      es: "Esta propiedad está cerca de la playa.",
    },
    title: {
      en: "Beach",
      es: "Playa",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/10ce1091-c854-40f3-a2fb-defc2995bcaf.jpg",
  },
  {
    id: 2,
    name: "apartment",
    description: {
      en: "This is a comfortable Apartment.",
      es: "Este es un apartamento cómodo.",
    },
    title: {
      en: "Apartment",
      es: "Apartamento",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/bcd1adc0-5cee-4d7a-85ec-f6730b0f8d0c.jpg",
  },
  {
    id: 3,
    name: "luxe",
    description: {
      en: "This Property is considered Luxurious.",
      es: "Esta propiedad es considerada de lujo.",
    },
    title: {
      en: "Luxe",
      es: "Lujo",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/c8e2ed05-c666-47b6-99fc-4cb6edcde6b4.jpg",
  },
  {
    id: 4,
    name: "amazingView",
    description: {
      en: "This property has an amazing View.",
      es: "Esta propiedad tiene vistas increíbles.",
    },
    title: {
      en: "Amazing View",
      es: "Vistas Increíbles",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/3b1eb541-46d9-4bef-abc4-c37d77e3c21b.jpg",
  },
  {
    id: 5,
    name: "design",
    description: {
      en: "This property puts a big focus on design.",
      es: "Esta propiedad se enfoca mucho en el diseño.",
    },
    title: {
      en: "Design",
      es: "Diseño",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/50861fca-582c-4bcc-89d3-857fb7ca6528.jpg",
  },
  {
    id: 6,
    name: "mountains",
    description: {
      en: "This Property is located in the Andean Mountains.",
      es: "Esta propiedad está ubicada en los Andes.",
    },
    title: {
      en: "Mountains",
      es: "Los Andes",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/d7445031-62c4-46d0-91c3-4f29f9790f7a.jpg",
  },
  {
    id: 7,
    name: "tiny",
    description: {
      en: "This property is considered a Tiny Home.",
      es: "Esta propiedad es considerada una casa pequeña.",
    },
    title: {
      en: "Tiny Home",
      es: "Casa Pequeña",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/3271df99-f071-4ecf-9128-eb2d2b1f50f0.jpg",
  },
  {
    id: 8,
    name: "historic",
    description: {
      en: "This Property is considered Historic.",
      es: "Esta propiedad es considerada histórica.",
    },
    title: {
      en: "Historic Home",
      es: "Casa Histórica",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/33dd714a-7b4a-4654-aaf0-f58ea887a688.jpg",
  },
  {
    id: 9,
    name: "cabin",
    description: {
      en: "This is a cozy Cabin.",
      es: "Esta es una cabaña acogedora.",
    },
    title: {
      en: "Cabin",
      es: "Cabaña",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/3fb523a0-b622-4368-8142-b5e03df7549b.jpg",
  },
  {
    id: 10,
    name: "countryside",
    description: {
      en: "This Property is located in the Countryside.",
      es: "Esta propiedad está ubicada en la casa de campo.",
    },
    title: {
      en: "Countryside",
      es: "Casa de Campo",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/6ad4bd95-f086-437d-97e3-14d12155ddfe.jpg",
  },
  {
    id: 11,
    name: "omg",
    description: {
      en: "This Property has a wow factor.",
      es: "Esta propiedad tiene un factor espectacular.",
    },
    title: {
      en: "WOW!",
      es: "¡Espectacular!",
    },
    imageUrl:
      "https://a0.muscache.com/pictures/c5a4f6fc-c92c-4ae8-87dd-57f1ff1b89a6.jpg",
  },
];
