module.exports = {
	before: async (m, { users }) => {
		let role =
			users.level <= 3
				? "Warrior V"
				: users.level >= 3 && users.level <= 6
					? "Warrior IV"
					: users.level >= 6 && users.level <= 9
						? "Warrior III"
						: users.level >= 9 && users.level <= 12
							? "Warrior II"
							: users.level >= 12 && users.level <= 15
								? "Warrior I"
								: users.level >= 15 && users.level <= 18
									? "Elite V"
									: users.level >= 18 && users.level <= 21
										? "Elite IV"
										: users.level >= 21 && users.level <= 24
											? "Elite III"
											: users.level >= 24 &&
												  users.level <= 27
												? "Elite II"
												: users.level >= 27 &&
													  users.level <= 30
													? "Elite I"
													: users.level >= 30 &&
														  users.level <= 33
														? "Master V"
														: users.level >= 33 &&
															  users.level <= 36
															? "Master IV"
															: users.level >=
																		36 &&
																  users.level <=
																		39
																? "Master III"
																: users.level >=
																			39 &&
																	  users.level <=
																			42
																	? "Master II"
																	: users.level >=
																				42 &&
																		  users.level <=
																				45
																		? "Master I"
																		: users.level >=
																					45 &&
																			  users.level <=
																					48
																			? "Grand Master V"
																			: users.level >=
																						48 &&
																				  users.level <=
																						51
																				? "Grand Master IV"
																				: users.level >=
																							51 &&
																					  users.level <=
																							54
																					? "Grand Master III"
																					: users.level >=
																								54 &&
																						  users.level <=
																								57
																						? "Grand Master II"
																						: users.level >=
																									57 &&
																							  users.level <=
																									60
																							? "Grand Master I"
																							: users.level >=
																										60 &&
																								  users.level <=
																										63
																								? "Epic V"
																								: users.level >=
																											63 &&
																									  users.level <=
																											66
																									? "Epic IV"
																									: users.level >=
																												66 &&
																										  users.level <=
																												69
																										? "Epic III"
																										: users.level >=
																													69 &&
																											  users.level <=
																													71
																											? "Epic II"
																											: users.level >=
																														71 &&
																												  users.level <=
																														74
																												? "Epic I"
																												: users.level >=
																															74 &&
																													  users.level <=
																															77
																													? "Legend V"
																													: users.level >=
																																77 &&
																														  users.level <=
																																80
																														? "Legend IV"
																														: users.level >=
																																	80 &&
																															  users.level <=
																																	83
																															? "Legend III"
																															: users.level >=
																																		83 &&
																																  users.level <=
																																		86
																																? "Legend II"
																																: users.level >=
																																			86 &&
																																	  users.level <=
																																			89
																																	? "Legend I"
																																	: users.level >=
																																				89 &&
																																		  users.level <=
																																				91
																																		? "Mythic V"
																																		: users.level >=
																																					91 &&
																																			  users.level <=
																																					94
																																			? "Mythic IV"
																																			: users.level >=
																																						94 &&
																																				  users.level <=
																																						97
																																				? "Mythic III"
																																				: users.level >=
																																							97 &&
																																					  users.level <=
																																							100
																																					? "Mythic II"
																																					: users.level >=
																																								100 &&
																																						  users.level <=
																																								105
																																						? "Mythic I"
																																						: users.level >=
																																									105 &&
																																							  users.level <=
																																									120
																																							? "Mythical glory"
																																							: users.level >=
																																										120 &&
																																								  users.level <=
																																										150
																																								? "Majin"
																																								: users.level >=
																																											150 &&
																																									  users.level <=
																																											160
																																									? "Demon lord seed"
																																									: users.level >=
																																												160 &&
																																										  users.level <=
																																												170
																																										? "Demon lord"
																																										: users.level >=
																																													170 &&
																																											  users.level <=
																																													185
																																											? "True demon lord"
																																											: users.level >=
																																														185 &&
																																												  users.level <=
																																														200
																																												? "Octagram"
																																												: users.level >=
																																															200 &&
																																													  users.level <=
																																															400
																																													? "Older demon lord"
																																													: users.level >=
																																																405 &&
																																														  users.level <=
																																																700
																																														? "Great demon lord"
																																														: users.level >=
																																																	700 &&
																																															  users.level <=
																																																	1000
																																															? "Strongest demon lord"
																																															: "Star king dragon";
		users.role = role;
		return true;
	},
};
