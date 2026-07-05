const calculateCompatibilityScore = (userA, userB) => {
  let totalScore = 0;
  const breakdown = {
    interestMatch: 0,
    ageCompatibility: 0,
    languageMatch: 0,
    personalityMatch: 0,
    locationMatch: 0,
    academicMatch: 0
  };

  const interestsA = [
    ...userA.interests.entertainment,
    ...userA.interests.technology,
    ...userA.interests.lifestyle,
    ...userA.interests.education,
    ...userA.interests.recreation
  ];
  const interestsB = [
    ...userB.interests.entertainment,
    ...userB.interests.technology,
    ...userB.interests.lifestyle,
    ...userB.interests.education,
    ...userB.interests.recreation
  ];

  const commonInterests = interestsA.filter(interest => interestsB.includes(interest));
  breakdown.interestMatch = Math.min(commonInterests.length * 10, 40);
  totalScore += breakdown.interestMatch;

  if (userA.profile.ageRange === userB.profile.ageRange) {
    breakdown.ageCompatibility = 20;
  } else {
    const ranges = ['13-17', '18-20', '21-25', '26-30', '31+'];
    const idxA = ranges.indexOf(userA.profile.ageRange);
    const idxB = ranges.indexOf(userB.profile.ageRange);
    if (Math.abs(idxA - idxB) === 1) {
      breakdown.ageCompatibility = 10;
    }
  }
  totalScore += breakdown.ageCompatibility;

  if (userA.profile.preferredLanguage === userB.profile.preferredLanguage) {
    breakdown.languageMatch = 20;
  }
  totalScore += breakdown.languageMatch;

  const personalityKeys = ['introvertExtrovert', 'seriousFun', 'leaderFollower', 'morningNightOwl', 'talkativeReserved', 'textChatVoiceChat'];
  let personalityDiffSum = 0;
  personalityKeys.forEach(key => {
    personalityDiffSum += Math.abs((userA.personality[key] || 50) - (userB.personality[key] || 50));
  });
  const avgDiff = personalityDiffSum / personalityKeys.length;
  breakdown.personalityMatch = Math.round(20 * (1 - avgDiff / 100));
  totalScore += breakdown.personalityMatch;

  if (userA.profile.country === userB.profile.country) {
    breakdown.locationMatch = 10;
  }
  totalScore += breakdown.locationMatch;

  if (userA.academicInfo.institutionName && 
      userA.academicInfo.institutionName === userB.academicInfo.institutionName) {
    breakdown.academicMatch += 15;
  }
  if (userA.academicInfo.academicLevel === userB.academicInfo.academicLevel) {
    breakdown.academicMatch += 10;
  }
  if (userA.academicInfo.department && 
      userA.academicInfo.department === userB.academicInfo.department) {
    breakdown.academicMatch += 10;
  }
  totalScore += breakdown.academicMatch;

  return {
    totalScore: Math.min(totalScore, 100),
    breakdown,
    commonInterests
  };
};

const checkPreferenceCompatibility = (userA, userB) => {
  const checks = {
    ageCompatible: true,
    genderCompatible: true,
    locationCompatible: true,
    lookingForCompatible: true
  };

  if (userA.preferences.preferredAgeRange !== 'any' && 
      userA.preferences.preferredAgeRange !== userB.profile.ageRange) {
    checks.ageCompatible = false;
  }

  if (userA.preferences.preferredGender !== 'any' && 
      userA.preferences.preferredGender !== userB.profile.gender) {
    checks.genderCompatible = false;
  }

  if (userA.preferences.preferredLocation === 'same-country' && 
      userA.profile.country !== userB.profile.country) {
    checks.locationCompatible = false;
  }

  if (userA.preferences.lookingFor.length > 0 && userB.preferences.lookingFor.length > 0) {
    const commonLookingFor = userA.preferences.lookingFor.filter(
      item => userB.preferences.lookingFor.includes(item)
    );
    if (commonLookingFor.length === 0) {
      checks.lookingForCompatible = false;
    }
  }

  return checks;
};

const findBestMatches = async (userId, limit = 20) => {
  const User = require('../models/User');
  const Match = require('../models/Match');

  const currentUser = await User.findById(userId);
  if (!currentUser) return [];

  const existingMatches = await Match.find({
    $or: [{ user1: userId }, { user2: userId }]
  }).select('user1 user2');

  const matchedUserIds = existingMatches.map(m => 
    m.user1.toString() === userId.toString() ? m.user2.toString() : m.user1.toString()
  );

  const query = {
    _id: { $ne: userId, $nin: matchedUserIds },
    accountStatus: 'active',
    isVerified: true
  };

  if (currentUser.preferences.preferredGender !== 'any') {
    query['profile.gender'] = currentUser.preferences.preferredGender;
  }
  if (currentUser.preferences.preferredAgeRange !== 'any') {
    query['profile.ageRange'] = currentUser.preferences.preferredAgeRange;
  }
  if (currentUser.preferences.preferredLocation === 'same-country') {
    query['profile.country'] = currentUser.profile.country;
  }

  const potentialMatches = await User.find(query).limit(100);

  const scoredMatches = potentialMatches
    .map(candidate => {
      const scoreResult = calculateCompatibilityScore(currentUser, candidate);
      const prefChecks = checkPreferenceCompatibility(currentUser, candidate);
      const reverseChecks = checkPreferenceCompatibility(candidate, currentUser);

      const isMutuallyCompatible = 
        prefChecks.ageCompatible && 
        prefChecks.genderCompatible && 
        prefChecks.locationCompatible;

      return {
        user: candidate,
        score: scoreResult.totalScore,
        breakdown: scoreResult.breakdown,
        commonInterests: scoreResult.commonInterests,
        isCompatible: isMutuallyCompatible
      };
    })
    .filter(m => m.isCompatible && m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scoredMatches;
};

module.exports = {
  calculateCompatibilityScore,
  checkPreferenceCompatibility,
  findBestMatches
};
