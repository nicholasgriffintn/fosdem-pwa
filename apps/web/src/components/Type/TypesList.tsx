import { Link } from "@tanstack/react-router";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FeaturedFosdemImage } from "~/components/shared/FeaturedFosdemImage";
import { constants } from "~/constants";
import type { TypeIds } from "~/types/fosdem";
import { fosdemTypeDescriptions } from "~/data/fosdem-type-descriptions";

type TypesListProps = {
	types: {
		[key: string]: {
			id: TypeIds;
			name: string;
			trackCount: number;
		};
	};
};

export function TypesList({ types }: TypesListProps) {
	const typeKeys = Object.keys(types);

	return (
		<ul className="flex flex-wrap -mx-1 lg:-mx-4">
			{typeKeys.map((typeKey: string, index: number) => {
				const isLikelyLcpImage = index === 0;
				return (
					<li
						key={types[typeKey].id}
						className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3"
					>
						<Card className="lg:max-w-md w-full">
							<CardHeader>
								<CardTitle>
									<Link
										search={(prev: any) => ({
											...prev,
											year: prev.year || constants.DEFAULT_YEAR,
											day: prev.day || undefined,
										})}
										to="/type/$slug"
										params={{ slug: types[typeKey].id }}
										className="no-underline"
									>
										{types[typeKey].name}
									</Link>
								</CardTitle>
								<CardDescription>
									<div className="flex flex-row">
										<span className="text-xs">
											{types[typeKey].trackCount} TRACKS
										</span>
									</div>
								</CardDescription>
							</CardHeader>
							<CardContent className="w-full">
								<div className="min-h-[151px] bg-muted rounded-md mb-4">
									<FeaturedFosdemImage
										type={types[typeKey].id}
										size="featured"
										className="w-full rounded-md"
										loading={isLikelyLcpImage ? "eager" : "lazy"}
										fetchPriority={isLikelyLcpImage ? "high" : "auto"}
										decoding="async"
										showCaptionOnHover
									/>
								</div>
								{fosdemTypeDescriptions[
									typeKey as keyof typeof fosdemTypeDescriptions
								] && (
									<p className="text-sm">
										{
											fosdemTypeDescriptions[
												typeKey as keyof typeof fosdemTypeDescriptions
											]
										}
									</p>
								)}
							</CardContent>
							<CardFooter>
								<Button
									variant="secondary"
									asChild
									className="w-full no-underline"
								>
									<Link
										search={(prev: any) => ({
											...prev,
											year: prev.year || constants.DEFAULT_YEAR,
											day: prev.day || undefined,
										})}
										to="/type/$slug"
										params={{ slug: types[typeKey].id }}
									>
										View {types[typeKey].name ?? "Tracks"}
									</Link>
								</Button>
							</CardFooter>
						</Card>
					</li>
				);
			})}
		</ul>
	);
}
