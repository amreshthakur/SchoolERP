const store = (() => {
  let token = null;
  let user = null;
  let schoolInfo = { name: '', year: '', logo: null };

  return {
    get token() { return token; },
    get user()  { return user; },
    get schoolInfo() { return schoolInfo; },
    setSession(t, u) { token = t; user = u; },
    clear() { token = null; user = null; },
    setSchoolInfo(info) { Object.assign(schoolInfo, info); }
  };
})();