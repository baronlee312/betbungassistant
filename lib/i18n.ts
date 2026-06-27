export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export interface Dictionary {
  metadata: {
    title: string;
    description: string;
  };
  common: {
    languageSwitcherLabel: string;
    english: string;
    vietnamese: string;
  };
  dateTime: {
    dateTbd: string;
    timeTbd: string;
  };
  home: {
    eyebrow: string;
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    footer: string;
    groupStage: string;
    knockoutStage: string;
  };
  schedule: {
    ariaLabel: string;
    scheduleByDay: string;
    kickoffTimesUse: string;
    localTime: string;
    matchSingular: string;
    matchPlural: string;
  };
  matchCard: {
    openMatchDetails: string;
    home: string;
    away: string;
    venueTbd: string;
    versusShort: string;
  };
  matchDetail: {
    backToSchedule: string;
    venueTbd: string;
    home: string;
    away: string;
    matchup: string;
    versusShort: string;
    fifaRanking: string;
    rankingDiff: string;
    higher: string;
    lower: string;
  };
  recentForm: {
    recentForm: string;
    shown: string;
    noRecentMatches: string;
    versus: string;
    opponentTbd: string;
    home: string;
    away: string;
    neutral: string;
    notAvailable: string;
    winShort: string;
    drawShort: string;
    lossShort: string;
    loadingOlderMatches: string;
    loadMore: string;
    loadMoreUnavailable: string;
    clientLoadError: string;
    freeTierLimitReason: string;
    missingTeamReason: string;
    corners: string;
    yellowCards: string;
    redCards: string;
    avgCornersPerMatch: string;
    matchesOver5Corners: string;
    matchesUnder5Corners: string;
  };
  matchStats: {
    possession: string;
    shots: string;
    shotsOnTarget: string;
    corners: string;
    fouls: string;
    yellowCards: string;
    redCards: string;
    offsides: string;
    saves: string;
    statistics: string;
    noStats: string;
  };
  status: {
    result: string;
    scheduled: string;
    matchFinished: string;
  };
  fifaRankings: {
    title: string;
    description: string;
    rank: string;
    team: string;
    points: string;
    lastUpdated: string;
    backToHome: string;
    rankDiff: string;
    officialSource: string;
  };
  errors: {
    dataError: string;
    scheduleCouldNotLoad: string;
    scheduleErrorDescription: string;
    matchError: string;
    matchCouldNotLoad: string;
    matchErrorDescription: string;
    tryAgain: string;
    schedule: string;
  };
}

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    metadata: {
      title: "World Cup 2026 Stats",
      description: "World Cup 2026 match schedule and recent form from TheSportsDB.",
    },
    common: {
      languageSwitcherLabel: "Choose language",
      english: "English",
      vietnamese: "Tiếng Việt",
    },
    dateTime: {
      dateTbd: "Date TBD",
      timeTbd: "Time TBD",
    },
    home: {
      eyebrow: "FIFA World Cup",
      title: "Fixture board",
      emptyTitle: "No fixtures returned yet",
      emptyDescription:
        "TheSportsDB did not return World Cup {season} events for the free endpoint. This view will populate as soon as events are available from the API.",
      footer:
        "Powered by TheSportsDB v1 free API. Season fixtures are limited to the free-tier response window.",
      groupStage: "Group Stage",
      knockoutStage: "Knockout Stage",
    },
    schedule: {
      ariaLabel: "World Cup match schedule",
      scheduleByDay: "Schedule by day",
      kickoffTimesUse: "Kickoff times use",
      localTime: "Local time",
      matchSingular: "match",
      matchPlural: "matches",
    },
    matchCard: {
      openMatchDetails: "Open match details for {home} versus {away}",
      home: "Home",
      away: "Away",
      venueTbd: "Venue TBD",
      versusShort: "vs",
    },
    matchDetail: {
      backToSchedule: "Back to schedule",
      venueTbd: "Venue TBD",
      home: "Home",
      away: "Away",
      matchup: "Matchup",
      versusShort: "vs",
      fifaRanking: "FIFA Ranking",
      rankingDiff: "Ranking Difference",
      higher: "Higher",
      lower: "Lower",
    },
    recentForm: {
      recentForm: "Recent form",
      shown: "shown",
      noRecentMatches: "No recent matches were returned for this team on the free API tier.",
      versus: "vs",
      opponentTbd: "Opponent TBD",
      home: "Home",
      away: "Away",
      neutral: "Neutral",
      notAvailable: "N/A",
      winShort: "W",
      drawShort: "D",
      lossShort: "L",
      loadingOlderMatches: "Loading older matches",
      loadMore: "Load More",
      loadMoreUnavailable: "Load More unavailable",
      clientLoadError: "Unable to load older matches from TheSportsDB.",
      freeTierLimitReason:
        "TheSportsDB v1 free API does not expose older team-history pagination, so the free-tier view is limited to the latest previous event.",
      missingTeamReason: "TheSportsDB did not include a team ID for this fixture.",
      corners: "Corners",
      yellowCards: "Yellow Cards",
      redCards: "Red Cards",
      avgCornersPerMatch: "Avg Corners/Match",
      matchesOver5Corners: "Matches ≥ 5 Corners",
      matchesUnder5Corners: "Matches < 5 Corners",
    },
    matchStats: {
      possession: "Ball Possession",
      shots: "Total Shots",
      shotsOnTarget: "Shots on Target",
      corners: "Corner Kicks",
      fouls: "Fouls",
      yellowCards: "Yellow Cards",
      redCards: "Red Cards",
      offsides: "Offsides",
      saves: "Goalkeeper Saves",
      statistics: "Match Statistics",
      noStats: "Detailed statistics are not available for this match yet.",
    },
    status: {
      result: "Result",
      scheduled: "Scheduled",
      matchFinished: "Match Finished",
    },
    fifaRankings: {
      title: "FIFA Men's World Ranking",
      description: "Latest official FIFA world rankings for national teams.",
      rank: "Rank",
      team: "Team",
      points: "Points",
      lastUpdated: "Last Updated",
      backToHome: "Back to Home",
      rankDiff: "Rank Difference",
      officialSource: "Official FIFA Ranking",
      },
    errors: {
      dataError: "Data error",
      scheduleCouldNotLoad: "The schedule could not load",
      scheduleErrorDescription:
        "TheSportsDB did not respond successfully. Retry the route to request the fixture board again.",
      matchError: "Match error",
      matchCouldNotLoad: "Match details could not load",
      matchErrorDescription:
        "The match or recent form request failed. Retry the route or return to the schedule.",
      tryAgain: "Try again",
      schedule: "Schedule",
    },
  },
  vi: {
    metadata: {
      title: "Thống kê World Cup 2026",
      description: "Lịch thi đấu World Cup 2026 và phong độ gần đây từ TheSportsDB.",
    },
    common: {
      languageSwitcherLabel: "Chọn ngôn ngữ",
      english: "Tiếng Anh",
      vietnamese: "Tiếng Việt",
    },
    dateTime: {
      dateTbd: "Chưa xác định ngày",
      timeTbd: "Chưa xác định giờ",
    },
    home: {
      eyebrow: "FIFA World Cup",
      title: "Lịch thi đấu",
      emptyTitle: "Chưa có trận đấu",
      emptyDescription:
        "TheSportsDB chưa trả về sự kiện World Cup {season} cho endpoint miễn phí. Trang này sẽ tự hiển thị khi API có dữ liệu.",
      footer:
        "Dữ liệu từ TheSportsDB v1 free API. Lịch theo mùa bị giới hạn trong phạm vi phản hồi của gói miễn phí.",
      groupStage: "Vòng bảng",
      knockoutStage: "Vòng loại trực tiếp",
    },
    schedule: {
      ariaLabel: "Lịch thi đấu World Cup",
      scheduleByDay: "Lịch theo ngày",
      kickoffTimesUse: "Giờ bóng lăn theo",
      localTime: "Giờ địa phương",
      matchSingular: "trận",
      matchPlural: "trận",
    },
    matchCard: {
      openMatchDetails: "Mở chi tiết trận {home} gặp {away}",
      home: "Chủ nhà",
      away: "Đội khách",
      venueTbd: "Chưa xác định sân",
      versusShort: "vs",
    },
    matchDetail: {
      backToSchedule: "Quay lại lịch",
      venueTbd: "Chưa xác định sân",
      home: "Chủ nhà",
      away: "Đội khách",
      matchup: "Đối đầu",
      versusShort: "gặp",
      fifaRanking: "Bảng xếp hạng FIFA",
      rankingDiff: "Chênh lệch thứ hạng",
      higher: "Cao hơn",
      lower: "Thấp hơn",
    },
    recentForm: {
      recentForm: "Phong độ gần đây",
      shown: "đã hiển thị",
      noRecentMatches: "API miễn phí chưa trả về trận gần đây cho đội này.",
      versus: "gặp",
      opponentTbd: "Chưa xác định đối thủ",
      home: "Chủ nhà",
      away: "Đội khách",
      neutral: "Sân trung lập",
      notAvailable: "N/A",
      winShort: "T",
      drawShort: "H",
      lossShort: "B",
      loadingOlderMatches: "Đang tải trận cũ hơn",
      loadMore: "Tải thêm",
      loadMoreUnavailable: "Không thể tải thêm",
      clientLoadError: "Không thể tải thêm trận cũ từ TheSportsDB.",
      freeTierLimitReason:
        "TheSportsDB v1 free API không hỗ trợ phân trang lịch sử đội, nên gói miễn phí chỉ hiển thị trận gần nhất.",
      missingTeamReason: "TheSportsDB không cung cấp ID đội cho trận này.",
      corners: "Phạt góc",
      yellowCards: "Thẻ vàng",
      redCards: "Thẻ đỏ",
      avgCornersPerMatch: "TB phạt góc/trận",
      matchesOver5Corners: "Trận ≥ 5 góc",
      matchesUnder5Corners: "Trận < 5 góc",
    },
    matchStats: {
      possession: "Kiểm soát bóng",
      shots: "Tổng cú sút",
      shotsOnTarget: "Sút trúng đích",
      corners: "Phạt góc",
      fouls: "Phạm lỗi",
      yellowCards: "Thẻ vàng",
      redCards: "Thẻ đỏ",
      offsides: "Việt vị",
      saves: "Cứu thua",
      statistics: "Thống kê trận đấu",
      noStats: "Chưa có thống kê chi tiết cho trận đấu này.",
    },
    status: {
      result: "Kết quả",
      scheduled: "Sắp diễn ra",
      matchFinished: "Đã kết thúc",
    },
    fifaRankings: {
      title: "Bảng xếp hạng FIFA",
      description: "Bảng xếp hạng thế giới chính thức mới nhất của FIFA cho các đội tuyển quốc gia nam.",
      rank: "Hạng",
      team: "Đội tuyển",
      points: "Điểm",
      lastUpdated: "Cập nhật lần cuối",
      backToHome: "Quay lại trang chủ",
      rankDiff: "Chênh lệch thứ hạng",
      officialSource: "Bảng xếp hạng FIFA chính thức",
      },
    errors: {
      dataError: "Lỗi dữ liệu",
      scheduleCouldNotLoad: "Không thể tải lịch thi đấu",
      scheduleErrorDescription:
        "TheSportsDB chưa phản hồi thành công. Hãy thử tải lại lịch thi đấu.",
      matchError: "Lỗi trận đấu",
      matchCouldNotLoad: "Không thể tải chi tiết trận",
      matchErrorDescription:
        "Yêu cầu dữ liệu trận hoặc phong độ gần đây thất bại. Hãy thử lại hoặc quay về lịch thi đấu.",
      tryAgain: "Thử lại",
      schedule: "Lịch thi đấu",
    },
  },
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getLocaleLanguageTag(locale: Locale): string {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function getLocalizedPath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
