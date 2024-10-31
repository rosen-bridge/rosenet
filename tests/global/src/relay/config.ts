export default {
  whitelist: process.env.WHITELIST!.split(','),
  maxReservations: +process.env.MAX_RESERVATIONS!,
};
