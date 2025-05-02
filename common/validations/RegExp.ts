const RegexExpression = Object.freeze({
  NumbersOnly: /^\d+$/,
  IntegersOnly: /^[1-9]\d*(\.\d+)?$/,
  CharactersAndIntegers: /\d/,
  Email:
    // eslint-disable-next-line max-len
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  Password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)(?=.*[\W_]).{8,16}$/,
  SpecialChars: /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/,
  Alphabhets: /[a-zA-Z]/,
  ParseQueryParams: /[?&]([^=#]+)=([^&#]*)/g,
});

export { RegexExpression };
