export const translations = {
  es: {
    // Navigation
    navbar: {
      airbnbHome: "Publicar en Destinos Venezuela",
      myListing: "Mis Anuncios",
      myFavorites: "Mis Favoritos",
      myReservation: "Mis Reservas",
      logout: "Cerrar Sesi�n",
      register: "Registrarse",
      login: "Iniciar Sesi�n",
    },

    // Search Box
    searchBox: {
      anywhere: "Cualquier lugar",
      anyWeek: "Cualquier semana",
      addGuest: "Agregar cupos",
      search: "Buscar",
    },

    // Language
    language: {
      spanish: "Espa�ol",
      english: "English",
    },

    // Create Home
    createHome: {
      describeHome: "�Cu�l de estas describe mejor tu hogar?",
      cancel: "Cancelar",
      next: "Siguiente",
      
      // Address page
      address: "Direcci�n",
      country: "Pa�s",
      selectCountry: "Selecciona un pa�s",
      
      // Description page
      description: "Descripci�n",
      price: "Precio",
      pricePerNight: "Precio por noche en USD",
      image: "Imagen",
      guests: "Hu�spedes",
      howManyGuests: "�Cu�ntos hu�spedes deseas?",
      bedrooms: "Dormitorios",
      howManyBedrooms: "�Cu�ntos dormitorios tienes?",
      bathrooms: "Ba�os",
      howManyBathrooms: "�Cu�ntos ba�os tienes?",
      beds: "Camas",
      howManyBeds: "�Cu�ntas camas tienes?",
      title: "T�tulo",
      titlePlaceholder: "Nombre de tu propiedad",
    },

    // Home Details
    homeDetails: {
      hostedBy: "Anfitri�n: ",
      hostSince: "Anfitri�n desde ",
      makeReservation: "Hacer una reserva",
      pleaseWait: "Por favor espera...",
    },

    // Listings
    listing: {
      night: "noche",
      myListings: "Mis Anuncios",
      noListings: "No tienes anuncios",
      noListingsDescription: "Crea un nuevo anuncio para empezar",
    },

    // Favorites
    favorites: {
      myFavorites: "Mis Favoritos",
      noFavorites: "No tienes favoritos",
      noFavoritesDescription: "Guarda propiedades en tus favoritos para verlas despu�s",
    },

    // Reservations
    reservations: {
      myReservations: "Mis Reservas",
      noReservations: "No tienes reservas",
      noReservationsDescription: "Realiza una reserva para verla aqu�",
    },

    // Buttons
    buttons: {
      pleaseWait: "Por favor espera",
      next: "Siguiente",
      cancel: "Cancelar",
      delete: "Eliminar",
      save: "Guardar",
      confirm: "Confirmar",
    },

    // Messages
    messages: {
      loading: "Cargando...",
      error: "Error",
      success: "�xito",
      noResults: "Sin resultados",
    },
  },

  en: {
    // Navigation
    navbar: {
      airbnbHome: "Airbnb your home",
      myListing: "Mis Anuncios",
      myFavorites: "My Favorites",
      myReservation: "My Reservations",
      logout: "Log out",
      register: "Register",
      login: "Login",
    },

    // Search Box
    searchBox: {
      anywhere: "Anywhere",
      anyWeek: "Any Week",
      addGuest: "Add Guest",
      search: "Search",
    },

    // Language
    language: {
      spanish: "Espa�ol",
      english: "English",
    },

    // Create Home
    createHome: {
      describeHome: "Which of these best describe your home?",
      cancel: "Cancel",
      next: "Next",
      
      // Address page
      address: "Address",
      country: "Country",
      selectCountry: "Select a country",
      
      // Description page
      description: "Description",
      price: "Price",
      pricePerNight: "Price per Night in USD",
      image: "Image",
      guests: "Guests",
      howManyGuests: "How many guests do you want?",
      bedrooms: "Bedrooms",
      howManyBedrooms: "How many bedrooms do you have?",
      bathrooms: "Bathrooms",
      howManyBathrooms: "How many bathrooms do you have?",
      beds: "Beds",
      howManyBeds: "How many beds do you have?",
      title: "Title",
      titlePlaceholder: "Name of your property",
    },

    // Home Details
    homeDetails: {
      hostedBy: "Hosted by ",
      hostSince: "Host since ",
      makeReservation: "Make a reservation",
      pleaseWait: "Please wait...",
    },

    // Listings
    listing: {
      night: "night",
      myListings: "Mis Anuncios",
      noListings: "You have no listings",
      noListingsDescription: "Create a new listing to get started",
    },

    // Favorites
    favorites: {
      myFavorites: "My Favorites",
      noFavorites: "You have no favorites",
      noFavoritesDescription: "Save properties to your favorites to see them later",
    },

    // Reservations
    reservations: {
      myReservations: "My Reservations",
      noReservations: "You have no reservations",
      noReservationsDescription: "Make a reservation to see it here",
    },

    // Buttons
    buttons: {
      pleaseWait: "Please wait",
      next: "Next",
      cancel: "Cancel",
      delete: "Delete",
      save: "Save",
      confirm: "Confirm",
    },

    // Messages
    messages: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      noResults: "No results",
    },
  },
};

export type Language = "en" | "es";
export type Translations = typeof translations.en;



