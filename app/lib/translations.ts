export const translations = {
  es: {
    // Navigation
    navbar: {
      airbnbHome: "Tu hogar en Airbnb",
      myListing: "Mis Anuncios",
      myFavorites: "Mis Favoritos",
      myReservation: "Mis Reservas",
      logout: "Cerrar Sesión",
      register: "Registrarse",
      login: "Iniciar Sesión",
    },

    // Search Box
    searchBox: {
      anywhere: "Cualquier lugar",
      anyWeek: "Cualquier semana",
      addGuest: "Agregar huéspedes",
      search: "Buscar",
    },

    // Language
    language: {
      spanish: "Español",
      english: "English",
    },

    // Create Home
    createHome: {
      describeHome: "¿Cuál de estas describe mejor tu hogar?",
      cancel: "Cancelar",
      next: "Siguiente",
      
      // Address page
      address: "Dirección",
      country: "País",
      selectCountry: "Selecciona un país",
      
      // Description page
      description: "Descripción",
      price: "Precio",
      pricePerNight: "Precio por noche en EUR",
      image: "Imagen",
      guests: "Huéspedes",
      howManyGuests: "¿Cuántos huéspedes deseas?",
      bedrooms: "Dormitorios",
      howManyBedrooms: "¿Cuántos dormitorios tienes?",
      bathrooms: "Baños",
      howManyBathrooms: "¿Cuántos baños tienes?",
      beds: "Camas",
      howManyBeds: "¿Cuántas camas tienes?",
      title: "Título",
      titlePlaceholder: "Nombre de tu propiedad",
    },

    // Home Details
    homeDetails: {
      hostedBy: "Anfitrión: ",
      hostSince: "Anfitrión desde ",
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
      noFavoritesDescription: "Guarda propiedades en tus favoritos para verlas después",
    },

    // Reservations
    reservations: {
      myReservations: "Mis Reservas",
      noReservations: "No tienes reservas",
      noReservationsDescription: "Realiza una reserva para verla aquí",
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
      success: "Éxito",
      noResults: "Sin resultados",
    },
  },

  en: {
    // Navigation
    navbar: {
      airbnbHome: "Airbnb your home",
      myListing: "My Listings",
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
      spanish: "Español",
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
      pricePerNight: "Price per Night in EUR",
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
      myListings: "My Listings",
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
