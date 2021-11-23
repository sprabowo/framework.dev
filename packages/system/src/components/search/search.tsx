import classNames from "classnames"
import React, { useMemo, useState } from "react"
import Fuse from "fuse.js"
import { searchStyle } from "./search.css"
import { AllCategories, AllModelsByName } from "../../models/all-categories"
import { sprinkles } from "../../sprinkles/sprinkles.css"
import { FilterMenu } from "./filter-menu"
import { SideDialog } from "../side-dialog"
import { Button } from "../button"
import { ResultsCategory } from "./results-category"
import {
	emptyFilterSet,
	filterCategories,
	filterRecords,
	getSearchResults,
	parseQueryString,
	serializeQueryParams,
} from "./query-util"
import { SearchAutocomplete } from "./search-autocomplete"
import { FilterIcon } from "../../icons/filter-icon"
import { FilterSet } from "./types"

export interface SearchProps extends React.ComponentPropsWithoutRef<"section"> {
	data: AllCategories[]
	preFilters?: FilterSet
}

export function Search({
	className,
	data: initialData,
	preFilters = emptyFilterSet,
	...props
}: SearchProps) {
	const data = useMemo(() => {
		const data = filterCategories(initialData, preFilters)
		for (const category of data) {
			// @ts-expect-error just a very silly "cannot iterate over a union" error here
			category.data = filterRecords(category.data, preFilters)
		}
		return data
	}, [initialData, preFilters])
	const searchIndices: {
		[K in keyof AllModelsByName]?: Fuse<AllModelsByName[K]>
	} = useMemo(
		() =>
			Object.fromEntries(
				data.map((category) => [
					category.name,
					new Fuse<AllCategories["data"][number]>(category.data, {
						keys: [...category.indexMetadata.searchableFields],
						ignoreLocation: true,
						includeScore: true,
						threshold: 0.2,
						useExtendedSearch: true,
					}),
				])
			),
		[data]
	)
	const [query, setQuery] = useState("")
	const [filterMenuOpen, setFilterMenuOpen] = useState(false)
	const { params: queryParams, availableFilters } = parseQueryString(
		query,
		data,
		preFilters
	)
	return (
		<section className={classNames(className, searchStyle)} {...props}>
			<div className={sprinkles({ layout: "row", gap: 12 })}>
				<SearchAutocomplete
					staticPrefix={serializeQueryParams({
						filters: preFilters,
						textSearch: "",
					})}
					availableFilters={availableFilters}
					className={sprinkles({ width: "full" })}
					onChange={setQuery}
					value={query}
					data={data}
				/>
				<Button
					as="button"
					color="tertiary"
					onClick={() => setFilterMenuOpen(true)}
				>
					Advanced <FilterIcon />
				</Button>
				<SideDialog
					position="right"
					isOpen={filterMenuOpen}
					onDismiss={() => setFilterMenuOpen(false)}
				>
					<FilterMenu
						params={queryParams}
						availableFilters={availableFilters}
						onConfirm={(newParams) => {
							setQuery(serializeQueryParams(newParams))
							setFilterMenuOpen(false)
						}}
					/>
				</SideDialog>
			</div>
			<div className={sprinkles({ layout: "stack", gap: 8 })}>
				{(query ||
					preFilters.category.length > 0 ||
					preFilters.field.length > 0 ||
					preFilters.tag.length > 0) &&
					data
						.filter((category) =>
							queryParams.filters.category.length > 0
								? isInFilteredCategories(category)
								: true
						)
						.map((category, _index) => (
							<ResultsCategory
								key={category.name}
								category={category.name}
								variant={
									preFilters.category.length === 1 ? "bare" : "withHeading"
								}
								searchResults={getSearchResults({
									category: category.name,
									data: category.data,
									params: queryParams,
									searchIndex: searchIndices[category.name],
								})}
							/>
						))}
			</div>
		</section>
	)

	function isInFilteredCategories(category: AllCategories): unknown {
		return queryParams.filters.category.some(
			(includedCategory) => includedCategory === category.name
		)
	}
}
